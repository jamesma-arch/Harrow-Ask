# Staff usability update

This repository contains a compiled website rather than its original React source project. The staff tutorial is maintained in `staff-guide.js` and `staff-guide.css`, loaded by `index.html`.

The revised app bundle `assets/index-staff-20261003.js` contains homepage wording changes only. The original bundle is retained. Reapply those wording changes to the original source project when it becomes available, then regenerate the production build. Preserve the guide script and stylesheet references when rebuilding.

The English/Thai switch translates the tutorial only. Assistant content, permissions, data and underlying AI services are unchanged. This is a directory of assistants, not a unified chat service.

Validation: JavaScript syntax checks passed for the tutorial and revised app bundle. Asset paths were checked against the repository and corrected for case sensitivity. Browser interaction and visual QA remain outstanding because the available runtime has no installed browser executable. Review on a Netlify deploy preview before merging.
