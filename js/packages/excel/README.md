# Nepali Calendar for Excel

An Excel add-in that converts dates between AD and Nepali (Bikram Sambat, BS) with worksheet
functions. It works in Excel on Windows, Mac and the web, and covers the same range as the rest
of OSN.NepaliCalendar: BS 1970-01-01 to BS 2090-12-30 (AD 1913-04-13 to AD 2034-04-13).

It also adds a **Nepali Date** button to the Home tab, which opens a converter that can insert a
date in the selected cell, and a short reference of the functions.

## Functions

| Function                                    | Returns                                                    | Example                                              |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| `=NEPALI.TOBS(date, [format], [script])`    | The BS date of an AD date, as text.                        | `=NEPALI.TOBS(A1)` → `2082-06-16`                    |
| `=NEPALI.TOAD(bs_date)`                     | The AD date of a BS date, as an Excel date.                | `=NEPALI.TOAD("2082-06-16")` → 2 Oct 2025            |
| `=NEPALI.DATE(year, month, day)`            | The AD date of a BS year, month and day, as an Excel date. | `=NEPALI.DATE(2082, 6, 16)` → 2 Oct 2025             |
| `=NEPALI.YEAR(date)`                        | The BS year of an AD date.                                 | `2082`                                               |
| `=NEPALI.MONTH(date)`                       | The BS month of an AD date, 1 (Baisakh) to 12 (Chaitra).   | `6`                                                  |
| `=NEPALI.DAY(date)`                         | The day of the BS month of an AD date.                     | `16`                                                 |
| `=NEPALI.FORMAT(bs_date, format, [script])` | A BS date in another format.                               | `=NEPALI.FORMAT(B1, "D", "nepali")` → `१६ असोज २०८२` |
| `=NEPALI.TODAY([format], [script])`         | Today's BS date, as text. Recalculates like `TODAY()`.     | `2083-06-27`                                         |
| `=NEPALI.DAYSINMONTH(year, month)`          | The number of days in a BS month.                          | `=NEPALI.DAYSINMONTH(2081, 2)` → `32`                |
| `=NEPALI.MONTHNAME(month, [script])`        | The name of a BS month.                                    | `=NEPALI.MONTHNAME(6, "nepali")` → `असोज`            |

- **AD dates** (`date`) are Excel dates, or text like `2025-10-02`. The time of day is ignored.
- **BS dates** (`bs_date`) are text like `2082-06-16`, `2082/6/16` or `२०८२-०६-१६`. When you type
  `2082-06-16` into a cell, Excel turns it into the AD date 16 June 2082; the functions read that
  back as the BS date you typed, so it still works. Format such cells as Text to keep what you see
  the same as what you typed.
- **Formats** are the same as `NepaliDate.ToString` in .NET and `formatBs` in JavaScript: `d`
  (`2082-06-16`, the default), `D` (`16 Ashwin 2082`), `F` (`Bihibar, 16 Ashwin 2082`), `M`
  (`16 Ashwin`), `Y` (`Ashwin 2082`), or a custom format with `yyyy`, `yy`, `MMMM`, `MM`, `M`,
  `dddd`, `ddd`, `dd` and `d`.
- **Script** is `"roman"` (the default) or `"nepali"` for Devanagari names and digits.
- `TOAD` and `DATE` return Excel dates, which show as numbers (`45932`) until the cell is formatted
  as a date.
- A date that does not exist or is out of range gives `#VALUE!`, with the reason in the cell's
  error tooltip.
- Workbooks that use the 1904 date system (an option in older Mac workbooks) are not supported:
  their dates are 1,462 days off.

## Installing

### From the hosted build

Once the add-in is deployed (see below), its manifest is at
`https://unicodist.github.io/OSN.NepaliCalendar/excel/manifest.xml`. Download it, then:

- **Excel on the web:** Home > Add-ins > More Add-ins > My Add-ins > Upload My Add-in, and pick
  `manifest.xml`.
- **Excel on Windows:** put `manifest.xml` in a shared network folder, add that folder under
  File > Options > Trust Center > Trust Center Settings > Trusted Add-in Catalogs (tick "Show in
  Menu"), restart Excel, then Home > Add-ins > More Add-ins > Shared Folder.
- **Excel on Mac:** copy `manifest.xml` to
  `~/Library/Containers/com.microsoft.Excel/Data/Documents/wef` (create the folder if needed),
  restart Excel, then Home > Add-ins and pick it under Developer Add-ins.
- **An organization:** a Microsoft 365 admin can deploy `manifest.xml` to everyone from the
  Microsoft 365 admin center (Settings > Integrated apps > Upload custom apps).

Uploaded and sideloaded add-ins are for testing and private use. To list it for everyone in
Excel's add-in store, submit `manifest.xml` to AppSource through Microsoft Partner Center.

### Deploying

`.github/workflows/excel-addin.yml` builds the add-in and deploys it to GitHub Pages. Set
Settings > Pages > Source to "GitHub Actions" once, then run the **Excel add-in** workflow from
the Actions tab. The manifest's URLs point at wherever Pages serves the site.

To host it somewhere else, build with that URL (https, ending in `/`) and upload `dist/`:

```shell
cd js
ADDIN_BASE_URL=https://example.com/nepali-calendar/ npm run build -w packages/excel
```

Keep the `<Id>` in `manifest.template.xml` unchanged across releases, and bump `version` in
`package.json` for each release, since Office caches add-ins by ID and version.

## Developing

```shell
cd js
npm install
npm test -w packages/excel
npx office-addin-dev-certs install                              # once: trusted localhost certificate
ADDIN_BASE_URL=https://localhost:3000/ npm run build -w packages/excel
npm run serve -w packages/excel                                 # https://localhost:3000/
```

Then sideload `packages/excel/dist/manifest.xml` as above.

- `src/functions.ts` has the functions, which read Excel's cell values and throw `InputError`
  for bad input. `src/register.ts` registers them with Excel and turns those errors into
  `#VALUE!`.
- `src/functions.json` describes each function to Excel (names, parameters, help text). A test
  checks that it lists every function in `FUNCTIONS`.
- `src/taskpane.ts` and `public/taskpane.html` are the Nepali Date task pane.
- `scripts/build.mjs` bundles both scripts with esbuild (the core package is bundled in) and
  writes `dist/manifest.xml` from `manifest.template.xml`.
