# Product overview

Cellkeep is a small local tool for preserving CSV values when handing data to someone who uses Excel. Its first audience is operations staff and small e-commerce teams exporting SKUs, tracking IDs, postal codes and reference strings.

## Why this problem

Research checked on 16 November 2026:

- Microsoft explicitly documents loss of leading zeros, 15-digit precision and automatic date/scientific conversion: [Keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers) and [Advanced options](https://support.microsoft.com/en-us/excel/advanced-options).
- A recent Microsoft Q&A describes rounded long numbers when importing CSV: [Excel adding zeros to large numbers](https://learn.microsoft.com/en-gb/answers/questions/5929080/excel-adding-zeros-to-large-numbers).
- The US Department of Education's CRDC guidance explains that Excel can damage school IDs and make submissions unreadable: [Troubleshooting IDs converted by Excel](https://crdc.communities.ed.gov/sites/default/files/2024-12/Troubleshooting%20School%20or%20LEA%20IDs%20Converted%20by%20Excel.pdf).

These sources support an existing recurring problem. They do **not** establish market size, conversion rate, willingness to pay or customer adoption. This release has no claimed users, testimonials or revenue.

## Alternatives and the actual gap

Excel's own import workflow and conversion settings solve this for people who control their spreadsheet setup. Existing converters also address value preservation: [Devxcode](https://www.devxcode.studio/convert/csv-to-excel), [floi](https://floi.dev/csv-to-excel/) and [Tooloat](https://tooloat.com/csv-to-excel). This is a competitive category, not an undiscovered invention.

Cellkeep's positioning combines a downloadable offline app, explicit per-cell risk explanations, a portable JSON audit and conservative all-text output. The goal is to make a recurring small handoff task understandable and repeatable. The open-source code and tests make the behavior inspectable. This is differentiation in workflow and presentation, not a claim of technical exclusivity.

## The first release

One job: original CSV → review → literal-text workbook. No login, data upload or type guessing. The result protects original parsed text; it does not repair files already damaged by spreadsheet conversion. All numeric columns remain text. Large datasets and numeric calculations are outside this release.

## Business hypothesis

The first release is free and open source to reduce adoption friction. A plausible paid extension would be a batch workflow for teams that repeatedly export many files, with saved mappings and local integration. This is a hypothesis that needs actual voluntary demand. No paid feature, checkout, recurring charge, payment account or sale has been created for this release.

Before investing in a paid version, look for repeated use and explicit requests for batch conversion. Avoid building a subscription around a task people need only once. A single GitHub publication is not a customer acquisition strategy. No outreach or direct messages were sent as part of this project.

## Design direction

- **Product:** preserve CSV identifiers for operations staff handing data to spreadsheet users.
- **Character:** exact, calm, practical.
- **World:** export files, spreadsheet grids and careful data review.
- **Moments:** an original code with its leading zeros held in green; concrete cell values and quiet amber warnings.
- **Signature:** spreadsheet addresses and a literal `01` mark, used where they explain the data.

No existing UI was supplied. The unslop audit therefore applied to the new interface: no gradient decorations, emoji controls, fake customer counts, looping motion or generic marketing claims. Spacing uses a 4 px rhythm; system UI type and monospace source values keep the focus on the data. The interface itself supplies the product visual, so no generated decorative image is needed.
