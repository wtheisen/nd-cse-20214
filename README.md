# CSE 20214 — Introduction to Artificial Intelligence for Engineers

Source for [the course website](https://20214.williamtheisen.com/), built with Eleventy. Assignment documents and schedule entries come from the published spreadsheets configured in `config.json`.

## Assignment publishing standard

Use this workflow for future homework, practice packet, and exam releases:

- Link the course schedule to a website landing page, rather than directly to a document. Use the existing reading/homework styling, theme support, and navigation.
- Homework notebook buttons should open a student copy in Colab (`#copy=true`). The homework data loader applies this to Colab links and converts Drive notebook links to Colab first. Keep the instructor's original as the source.
- Practice packet Google Docs should offer a **Make a copy** button (`/copy`) and a separate embedded document preview (`/preview`). The assessment data loader generates both automatically for new scheduled packets. PDFs can be previewed and downloaded; they do not support the Google Docs copy prompt.
- Include a readable embedded preview on each homework, lab, and practice packet landing page. For notebooks, render the student notebook with `scripts/render_notebook_preview.py` into `static/homeworks/homeworkNN/homeworkNN` or `static/labs/labNN/labNN` (it writes `-light.html` and `-dark.html`) and commit both; the page picks them up automatically.
- Include the correct Canvas submission link where applicable, and verify its deadline. Homework (`canvasLink`) and packet (`submissionLink`) links are set in `src/_data/homeworks.js` and `src/_data/assessments.js`; none are configured yet for this course.
- Keep solutions in their own section on the landing page, with schedule solution links targeting `#solutions`. Solutions and exam review documents should open for reading, not force a student copy.
- Add exam documents and solutions to the assignment spreadsheet only when authorized for release after the exam. A populated link is treated as released; the website does not enforce release dates. Until then, the exam landing page shows an availability message.
- Before publishing, build with the current spreadsheet data, check the generated links, and verify the live landing page, copy prompt, preview, and submission destination. If a preview or submission link is not ready, report that explicitly rather than calling the release complete.

The shared templates apply these defaults to future assignments. Do not replace them with one-off direct-document schedule links.

## Labs

Every `Lab NN - Title` row in the schedule gets a page, `lab_NN.html`, titled from the text after the dash and linked from the schedule. Its notebook link comes from the `Lab NN` row of the Assignments tab (Colab and Drive notebooks open as a student copy); until that row has a link the page says the notebook isn't available yet.

## Development and deployment

Run `npm ci` and `npm run build`. Network access is needed to load the published course spreadsheets; check build output for fetch warnings. Generated files are written to `docs/`.

Changes pushed to `main` build and deploy through `.github/workflows/build.yaml`. Verify the deployment succeeds and inspect the live result.

**Sheet edits publish themselves.** Every 10 minutes the workflow fetches the published sheets and fingerprints them; if they differ from what was last deployed, it rebuilds and deploys, otherwise it stops after a few seconds. Expect a sheet edit on the site within about 10-15 minutes. Nothing needs installing and no token is involved.

Sheet downloads go through `lib/fetchCsv.js` (four attempts with timeouts). If a sheet still can't be loaded, or the schedule or Assignments tab comes back empty, the build fails and the live site stays as it was, rather than deploying a site with no schedule. Before deploying, `scripts/verify_build.sh` checks that the core pages and office hours rendered, that every page the home page links to was built, and that each released homework has its notebook link and a reachable preview. It needs no edits per release.
