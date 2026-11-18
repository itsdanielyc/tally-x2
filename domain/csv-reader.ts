import { MAX_TEXT_LENGTH } from "../contracts/primitives";

export interface CsvRecord { line: number; fields: string[]; error?: string }
const MAX_COLUMNS = 1000;

/** Time O(n), space O(n): slice segments rather than allocating a string per character. */
export class CsvReader {
  private start = 0;
  private parts: string[] = [];
  private fieldLength = 0;
  private fields: string[] = [];
  private records: CsvRecord[] = [];
  private line = 1;
  private rowStart = 1;
  private quoted = false;
  private closedQuote = false;
  private error: string | undefined;

  constructor(private readonly delimiter: string) {}

  /** Count physical lines while preserving their original bytes inside quoted fields. */
  read(source: string): CsvRecord[] {
    const text = source.replace(/^\ufeff/, "");
    for (let index = 0; index < text.length; index++) {
      const character = text[index];
      const next = text[index + 1];
      if (character === "\n" || character === "\r") {
        const length = character === "\r" && next === "\n" ? 2 : 1;
        if (!this.quoted) this.finishRecord(text, index);
        this.line++;
        if (!this.quoted) { this.rowStart = this.line; this.start = index + length; }
        if (length === 2) index++;
      } else if (this.consume(text, index, character, next)) index++;
    }
    if (this.quoted) this.error = "Unclosed quoted field";
    this.finishRecord(text, text.length);
    return this.records;
  }

  private consume(text: string, index: number, character: string, next: string | undefined): boolean {
    if (this.quoted) return this.consumeQuoted(text, index, character, next);
    if (character === this.delimiter) { this.finishField(text, index); return false; }
    if (character === '"') {
      if (index !== this.start || this.closedQuote) this.error = "Unexpected quote in unquoted field";
      else { this.quoted = true; this.start = index + 1; }
      return false;
    }
    if (this.closedQuote && character.trim()) this.error = "Unexpected text after closing quote";
    return false;
  }

  private consumeQuoted(text: string, index: number, character: string, next: string | undefined): boolean {
    if (character !== '"') return false;
    this.append(text.slice(this.start, index));
    if (next === '"') { this.append('"'); this.start = index + 2; return true; }
    this.quoted = false;
    this.closedQuote = true;
    this.start = index + 1;
    return false;
  }

  private append(value: string): void {
    this.fieldLength += value.length;
    if (this.fieldLength > MAX_TEXT_LENGTH) { this.error = "CSV field exceeds " + MAX_TEXT_LENGTH + " characters"; return; }
    this.parts.push(value);
  }

  private finishField(text: string, end: number): void {
    if (!this.closedQuote) this.append(text.slice(this.start, end));
    if (this.fields.length < MAX_COLUMNS) this.fields.push(this.parts.length === 1 ? this.parts[0] : this.parts.join(""));
    else this.error = "More than " + MAX_COLUMNS + " columns";
    this.parts = [];
    this.fieldLength = 0;
    this.closedQuote = false;
    this.start = end + 1;
  }

  private finishRecord(text: string, end: number): void {
    this.finishField(text, end);
    if (this.error || this.fields.some((field) => field.trim())) {
      this.records.push({ line: this.rowStart, fields: this.fields, ...(this.error ? { error: this.error } : {}) });
    }
    this.fields = [];
    this.error = undefined;
  }
}
