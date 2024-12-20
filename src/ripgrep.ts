import * as cp from "child_process";
import * as fs from "fs";
import { FindResult, FindResultHandler, FindResultLine } from "./find";
import { Result } from "./result";

/**
 * Wrapper for ripgrep.
 *
 * https://github.com/BurntSushi/ripgrep
 */
export class Ripgrep {
  readonly binaryPath: string;
  readonly options: string;

  private constructor(binaryPath: string, options: string) {
    this.binaryPath = binaryPath;
    this.options = options;
  }

  static new(
    binaryPath: string = "/usr/bin/rg",
    options: string = "--ignore-case --context=3 --json"
  ): Ripgrep {
    return new Ripgrep(binaryPath, options);
  }

  find(pattern: string, paths: string[], onFindResult: FindResultHandler) {
    const commandPaths = paths.join(" ");
    const searchCommand = `${this.binaryPath} ${this.options} ${pattern} ${commandPaths}`;

    const onExecCompletion = (
      error: cp.ExecException | null,
      stdout: string,
      stderr: string
    ) => {
      if (error) {
        if (error.code === 1) {
          // ripgrep exits with code 1 when no results are found;
          // other exit codes are other (real) errors
          onFindResult(Result.ofOk({}));
        } else {
          onFindResult(Result.ofError(error));
        }
      } else {
        onFindResult(Result.ofOk(parseRgOutput(stdout, paths)));
      }
    };

    console.log(`Ripgrep executing command: ${searchCommand}`);
    cp.exec(searchCommand, onExecCompletion);
  }
}

const parseRgOutput = (rgOutput: string, searchPaths: string[]): FindResult => {
  // ripgrep outputs the json lines in a natural order where matches within a
  // single file are subsequent
  const arr: any[] = deserializeRgOutput(rgOutput);

  const result: FindResult = {};
  for (let obj of arr) {
    // notice that the summary type doesn't have this populated
    const filePath = obj.type !== "summary" ? obj.data.path.text : "";

    switch (obj.type) {
      case "begin":
        if (!result.hasOwnProperty(filePath)) {
          result[filePath] = {
            filePath: filePath,
            shortFilePath: shortenFilePath(filePath, searchPaths),
            lines: [],
          };
        }
        break;
      case "end":
        // do nothing for now
        break;
      case "context":
        result[filePath].lines.push(mapContextTypeLine(obj));
        break;
      case "match":
        result[filePath].lines.push(mapMatchTypeLine(obj));
        break;
      case "summary":
        // do nothing for now
        break;
      default:
        console.warn(`Unknown ripgrep data type '${obj.type}'`);
        break;
    }
  }

  return result;
};

const shortenFilePath = (filePath: string, searchPaths: string[]): string => {
  for (let searchPath of searchPaths) {
    // skip non-directories
    if (!fs.lstatSync(searchPath).isDirectory()) {
      continue;
    }

    if (filePath.startsWith(searchPath)) {
      return filePath.substring(searchPath.length + 1); // +1 for the slash
    }
  }

  // couldn't shorten the path
  return filePath;
};

const deserializeRgOutput = (rgOutput: string): any[] => {
  const jsonLines = rgOutput.split("\n");
  const arr: any[] = [];
  for (let jsonLine of jsonLines) {
    if (jsonLine.trim().length > 0) {
      arr.push(JSON.parse(jsonLine));
    }
  }
  return arr;
};

/*
{
    "type": "context",
    "data": {
        "path": {
            "text": "package.json"
        },
        "lines": {
            "text": "    \"vscode:prepublish\": \"npm run compile\",\n"
        },
        "line_number": 24,
        "absolute_offset": 441,
        "submatches": []
    }
}
*/
const mapContextTypeLine = (obj: any): FindResultLine => {
  return {
    type: obj.type,
    lineNumber: obj.data["line_number"] as number,
    content: obj.data.lines.text,
  };
};

/*
{
    "type": "match",
    "data": {
        "path": {
            "text": "package.json"
        },
        "lines": {
            "text": "    \"pretest\": \"npm run compile && npm run lint\",\n"
        },
        "line_number": 27,
        "absolute_offset": 546,
        "submatches": [
            {
                "match": {
                    "text": "test"
                },
                "start": 8,
                "end": 12
            }
        ]
    }
}
*/
const mapMatchTypeLine = (obj: any): FindResultLine => {
  return {
    type: obj.type,
    lineNumber: obj.data["line_number"] as number,
    content: obj.data.lines.text,
    matchRanges: obj.data.submatches.map((submatch: any) => {
      return {
        start: submatch.start,
        end: submatch.end,
      };
    }),
  };
};

/*
{
    "type": "end",
    "data": {
        "path": {
            "text": "src/test/suite/index.ts"
        },
        "binary_offset": null,
        "stats": {
            "elapsed": {
                "secs": 0,
                "nanos": 104546,
                "human": "0.000105s"
            },
            "searches": 1,
            "searches_with_match": 1,
            "bytes_searched": 753,
            "bytes_printed": 5167,
            "matched_lines": 7,
            "matches": 8
        }
    }
}
*/
const mapEndTypeLine = (obj: any): any => {
  return {};
};

/*
{
    "data": {
        "elapsed_total": {
            "human": "0.011444s",
            "nanos": 11444195,
            "secs": 0
        },
        "stats": {
            "bytes_printed": 21004,
            "bytes_searched": 90138,
            "elapsed": {
                "human": "0.000684s",
                "nanos": 684456,
                "secs": 0
            },
            "matched_lines": 26,
            "matches": 35,
            "searches": 6,
            "searches_with_match": 6
        }
    },
    "type": "summary"
}
*/
const mapSummaryTypeLine = (obj: any): any => {
  return {};
};
