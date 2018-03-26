load("//:packages.bzl", "LAYOUT_PACKAGES")

# Base rollup globals for dependencies and the root entry-point.
LAYOUT_ROLLUP_GLOBALS = {
  'tslib': 'tslib',
  '@angular/flex-layout': 'ng.flexLayout',
}

# Rollup globals for subpackages in the form of, e.g., {"@angular/cdk/table": "ng.cdk.table"}
LAYOUT_ROLLUP_GLOBALS.update({
  "@angular/flex-layout/%s" % p: "ng.flexLayout.%s" % p for p in LAYOUT_PACKAGES
})
