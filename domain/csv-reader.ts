export interface CsvRecord { line: number; fields: string[]; error?: string }
const MAX_COLUMNS = 1000;

/** Time O(n), space O(n): one state machine preserves quotes and physical lines. */
export class CsvReader {
  private field = "";
  private fields: string[] = [];
  private records: CsvRecord[] = [];
  private line = 1;
  private rowStart = 1;
  private quoted = false;
  private closedQuote = false;
  private error: string | undefined;

  constructor(private readonly delimiter: string) {}

  /** Consume CSV without splitting physical lines inside quoted fields. */
  read(source: string): CsvRecord[] {
    const text = source.replace(/^\ufeff/, "");
    for (let index = 0; index < text.length; index++) {
      const character = text[index];
      const next = text[index + 1];
      if (character === "\n" || character === "\r") {
        const newline = character === "\r" && next === "\n" ? "\r\n" : character;
        if (this.quoted) this.field += newline;
        else this.finishRecord();
        this.line++;
        if (!this.quoted) this.rowStart = this.line;
        if (newline.length === 2) index++;
      } else if (this.consume(character, next)) index++;
    }
    if (this.quoted) this.error = "Unclosed quoted field";
    this.finishRecord();
    return this.records;
  }

  private consume(character: string, next: string | undefined): boolean {
    if (this.quoted) return this.consumeQuoted(character, next);
    if (character === this.delimiter) { this.finishField(); return false; }
    if (character === '"') {
      if (this.field.length || this.closedQuote) this.error = "Unexpected quote in unquoted field";
      else this.quoted = true;
      return false;
    }
    if (this.closedQuote) {
      if (character.trim()) this.error = "Unexpected text after closing quote";
      return false;
    }
    this.field += character;
    return false;
  }

  private consumeQuoted(character: string, next: string | undefined): boolean {
    if (character !== '"') { this.field += character; return false; }
    if (next === '"') { this.field += '"'; return true; }
    this.quoted = false;
    this.closedQuote = true;
    return false;
  }

  private finishField(): void {
    if (this.fields.length < MAX_COLUMNS) this.fields.push(this.field);
    else this.error = `More than ${MAX_COLUMNS} columns`;
    this.field = "";
    this.closedQuote = false;
  }

  private finishRecord(): void {
    this.finishField();
    if (this.error || this.fields.some((field) => field.trim())) {
      this.records.push({ line: this.rowStart, fields: this.fields, ...(this.error ? { error: this.error } : {}) });
    }
    this.fields = [];
    this.error = undefined;
  }
}
