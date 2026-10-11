# Releasing

The NuGet package and the npm packages have their own version numbers, so each has its own tag:

| Release | Tag | Version lives in |
| --- | --- | --- |
| NuGet `OSN.NepaliCalendar` | `nuget-v1.2.3` | `<VersionPrefix>` in `src/OSN.NepaliCalendar/OSN.NepaliCalendar.csproj` |
| npm `@opensourcenepal/nepali-calendar`, `-react`, `-angular` | `npm-v1.2.3` | `version` in the three `js/packages/*/package.json` files (all three move together) |

Pushing a tag runs the [Release workflow](.github/workflows/release.yml), which:

1. Writes release notes from the pull requests merged since the previous tag of the same kind,
   grouped by label (see [.github/release.yml](.github/release.yml)).
2. Builds, tests and packs the packages for that tag.
3. Creates a GitHub release with those notes and the packages attached.
4. Adds the notes to the top of [CHANGELOG.md](CHANGELOG.md) on `main`.

For NuGet the notes are also written into the package, so they show under "Release Notes" on
nuget.org.

## Cutting a release

1. Merge the pull requests that should be in the release. Label each one so it lands in the right
   section of the notes: `breaking-change`, `enhancement`, `bug` or `documentation`. Anything
   unlabelled goes under "Other changes", and `skip-changelog` leaves a pull request out.
2. Bump the version in a pull request and merge it (the workflow stops if the tag and the version in
   the files differ). For npm, React and Angular must depend on the new core version too, as
   `npm run release` checks.

   To write the notes yourself instead, add them to the same pull request as
   `.github/release-notes/<tag>.md` (for example `npm-v1.2.0.md`). The workflow uses that file as
   the release notes. If you also add the entry to CHANGELOG.md, as `## npm 1.2.0 (date)`, the
   workflow leaves the changelog alone.
3. Tag the merge on `main` and push the tag:

   ```sh
   git checkout main && git pull
   git tag nuget-v1.0.1        # or npm-v1.0.3
   git push origin nuget-v1.0.1
   ```

   You can also do this on GitHub: Releases, "Draft a new release", type the new tag name, pick
   `main` as the target and publish. Leave the notes empty; the workflow fills them in and attaches
   the packages.

4. Publish the packages:
   - **NuGet**: if the repository has a `NUGET_API_KEY` secret (Settings, Secrets and variables,
     Actions), the workflow pushes the package to nuget.org itself. Otherwise download the `.nupkg`
     from the GitHub release and upload it on nuget.org. Upload that file rather than one you
     packed locally, because it carries the release notes.
   - **npm**: from `js/`, run `npm run release` as before (`npm login` first).

A version with a suffix, such as `nuget-v1.1.0-beta.1`, is published as a pre-release.
