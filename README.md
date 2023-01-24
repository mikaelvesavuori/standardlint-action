# StandardLint Action

This Action makes it even easier to use StandardLint in your GitHub CI runs.

## Setup and usage

The only thing you need to run this action is a `standardlint.json` configuration file in your root directory. Please see the [StandardLint documentation](https://github.com/mikaelvesavuori/standardlint#configuration) for more details.

## Example of how to use this action in a workflow

```yml
on: [push]

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run StandardLint
        uses: mikaelvesavuori/standardlint-action@v1.0.0
        env:
          GITHUB_TOKEN: ${{ github.token }}
```
