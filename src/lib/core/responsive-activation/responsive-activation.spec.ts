/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {TestBed, inject, fakeAsync} from '@angular/core/testing';

import {BREAKPOINTS_PROVIDER} from '../breakpoints/break-points-provider';
import {BreakPointRegistry} from '../breakpoints/break-point-registry';
import {MockMatchMedia, MockMatchMediaProvider} from '../match-media/mock/mock-match-media';
import {MatchMedia} from '../match-media/match-media';
import {MediaMonitor} from '../media-monitor/media-monitor';
import {ResponsiveActivation, KeyOptions} from './responsive-activation';
import {MediaQuerySubscriber, MediaChange} from '../media-change';

describe('responsive-activation', () => {
  let monitor: MediaMonitor;
  let matchMedia: MockMatchMedia;

  /**
   * MediaQuery Change responder used to determine the activated input
   * value that should be used for the currently activate mediaQuery
   */
  function buildResponder(baseKey: string, defaultVal: any,
                          onMediaChanges: MediaQuerySubscriber, inputs?: {[key: string]: any}) {
    if (!inputs) { inputs = {}; }
    inputs[baseKey] = defaultVal;

    let options = new KeyOptions(baseKey, defaultVal, inputs);
    return new ResponsiveActivation(options, monitor, onMediaChanges);
  }


  beforeEach(() => {
    // Configure testbed to prepare services
    TestBed.configureTestingModule({
      providers: [
        MediaMonitor,
        BreakPointRegistry,   // Registry of known/used BreakPoint(s)
        BREAKPOINTS_PROVIDER, // Supports developer overrides of list of known breakpoints
        MockMatchMediaProvider,
      ]
    });
  });

  // Single async inject to save references; which are used in all tests below
  beforeEach(inject(
    [MatchMedia, MediaMonitor],
    (_matchMedia, _mediaMonitor) => {
      matchMedia = _matchMedia;      // Only used to manual/simulate activate a mediaQuery
      monitor = _mediaMonitor;
    }
  ));

  it('does not report mediaQuery changes for static usages', () => {
    let value;
    let onMediaChange = (changes: MediaChange) => value = changes.value;
    let responder = buildResponder('layout', 'row', onMediaChange);
    fakeAsync(() => {
      // Confirm static values are returned as expected
      expect(value).toBeUndefined();
      expect(responder.activatedInputKey).toEqual('layout');
      expect(responder.activatedInput).toEqual('row');

      // No responsive inputs were defined, so any mediaQuery
      // activations should not affect anything and the change handler
      // should NOT have been called.
      matchMedia.activate('xs');

      expect(value).toBeUndefined();
      expect(responder.activatedInputKey).toEqual('layout');
      expect(responder.activatedInput).toEqual('row');

      matchMedia.activate('gt-md');

      expect(value).toBeUndefined();
      expect(responder.activatedInputKey).toEqual('layout');
      expect(responder.activatedInput).toEqual('row');

      responder.destroy();
    });
  });

  it('reports mediaQuery changes for responsive usages', () => {
    let value;
    let onMediaChange = (changes: MediaChange) => value = changes.value;
    let responder = buildResponder('layout', 'row', onMediaChange, {
        'layout': 'row',
        'layoutXs': 'column',          // define trigger to 'xs' mediaQuery
        'layoutMd': 'column-reverse',  // define trigger to 'md' mediaQuery
        'layoutGtLg': 'row-reverse'    // define trigger to 'md' mediaQuery
      }
    );

    fakeAsync(() => {
      expect(value).toBeUndefined();

      matchMedia.activate('xs');
      expect(value).toEqual('column');

      matchMedia.activate('md');
      expect(value).toEqual('column-reverse');

      matchMedia.activate('gt-lg');
      expect(value).toEqual('row-reverse');

      responder.destroy();
    });
  });

  it('uses fallback to default input if the activated mediaQuery should be ignored', () => {
    let value;
    let onMediaChange = (changes: MediaChange) => value = changes.value;
    let responder = buildResponder('layout', 'row', onMediaChange, {
        'layout': 'row',
        'layoutXs': 'column',          // define input value link to 'xs' mediaQuery
      }
    );

    fakeAsync(() => {
      expect(value).toBeUndefined();

      matchMedia.activate('xs');
      expect(value).toEqual('column');

      // No input 'layoutMd' has been defined, so the fallback
      // to 'layout' input value should be used...
      matchMedia.activate('md');
      expect(value).toEqual('row');

      responder.destroy();
    });
  });

  it('uses closest responsive input value if the activated mediaQuery is not linked', () => {
    let value, enableOverlaps = false;
    let onMediaChange = (changes: MediaChange) => value = changes.value;
    let responder = buildResponder('layout', 'row', onMediaChange, {
        'layout': 'row',
        'layoutXs': 'column',          // define link to 'xs' mediaQuery
        'layoutGtSm': 'row-reverse'      // define link to 'gt-sm' mediaQuery
      }
    );

    fakeAsync(() => {
      expect(value).toBeUndefined();

      matchMedia.activate('xs');
      expect(value).toEqual('column');

      // No input 'layoutMd' has been defined, so the fallback
      // to 'layoutGtSm' input value should be used...
      matchMedia.activate('md', enableOverlaps = true);
      expect(value).toEqual('row-reverse');

      responder.destroy();
    });
  });

});
