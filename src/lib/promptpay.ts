/**
 * 753BC — PromptPay EMVCo Payload & Sharp Blueprint QR Generator
 * Standard EMVCo QR Code Specification for Thai PromptPay
 * Zero external dependencies. Generates sharp, blueprint-style SVG QR code.
 */

// ─── CRC16-CCITT Calculation ──────────────────────────────────────
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= (code << 8) & 0xffff;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Format Thai PromptPay Target (Mobile 10 digits -> 0066XXXXXXXXX or National ID 13 digits)
 */
export function formatPromptPayTarget(target: string): { type: "01" | "02"; value: string } {
  const clean = target.replace(/[^0-9]/g, "");
  if (clean.length === 13) {
    return { type: "02", value: clean };
  }
  // Mobile phone number (e.g. 0812345678 -> 0066812345678)
  const mobile = clean.startsWith("0") ? `0066${clean.substring(1)}` : `0066${clean}`;
  return { type: "01", value: mobile.padStart(13, "0") };
}

/**
 * Generate official PromptPay EMVCo Payload string
 */
export function generatePromptPayPayload(promptPayId: string, amount?: number): string {
  const target = formatPromptPayTarget(promptPayId);

  // Tag 29 Merchant Account Information - PromptPay AID
  const aid = tlv("00", "A000000677010111");
  const biller = tlv(target.type, target.value);
  const tag29 = tlv("29", `${aid}${biller}`);

  // Construct parts
  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += tlv("01", amount && amount > 0 ? "12" : "11"); // 12 = Dynamic (with amount), 11 = Static
  payload += tag29;
  payload += tlv("53", "764"); // Transaction Currency (THB = 764)

  if (amount !== undefined && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += tlv("54", formattedAmount);
  }

  payload += tlv("58", "TH"); // Country Code
  payload += "6304"; // Tag 63 (CRC) with length 04

  const checksum = crc16(payload);
  return `${payload}${checksum}`;
}

// ─── Minimalist QR Code Generator (Model 2 / Byte Mode) ───────────
// Self-contained QR encoder for up to ~150 chars (covers all PromptPay payloads)
// Standard Reed-Solomon GF(256) implementation

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGF() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = val;
    GF256_EXP[i + 255] = val;
    GF256_LOG[val] = i;
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0);
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

function rsGenPoly(numEc: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < numEc; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, numEc: number): Uint8Array {
  const gen = rsGenPoly(numEc);
  const ec = new Uint8Array(numEc);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ ec[0];
    for (let j = 0; j < numEc - 1; j++) {
      ec[j] = ec[j + 1] ^ gfMul(gen[numEc - j - 1], factor);
    }
    ec[numEc - 1] = gfMul(gen[0], factor);
  }
  return ec;
}

// QR Version table for Byte Mode (Version 4: 33x33 or Version 5: 37x37, ECC Level L)
// Version 4-L capacity: 78 bytes. Version 5-L capacity: 106 bytes. PromptPay payload is ~80 chars.
// Version 5: 37x37, 134 total codewords, 108 data codewords, 26 EC codewords (1 block)
const QR_VER = 5;
const QR_SIZE = 37;
const TOTAL_CODEWORDS = 134;
const DATA_CODEWORDS = 108;
const EC_CODEWORDS = 26;

export function encodeQRCodeMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const dataLen = utf8.length;

  // Build bit stream: 4-bit mode (Byte: 0100) + 8-bit count + data
  const bits: number[] = [0, 1, 0, 0];
  for (let i = 7; i >= 0; i--) {
    bits.push((dataLen >> i) & 1);
  }
  for (let i = 0; i < dataLen; i++) {
    const b = utf8[i];
    for (let j = 7; j >= 0; j--) {
      bits.push((b >> j) & 1);
    }
  }

  // Terminator (up to 4 zeroes)
  const remainingSpace = DATA_CODEWORDS * 8 - bits.length;
  const termLen = Math.min(4, Math.max(0, remainingSpace));
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Byte align
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert to bytes
  const dataBytes = new Uint8Array(DATA_CODEWORDS);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) {
      val = (val << 1) | bits[i + j];
    }
    if (byteIdx < DATA_CODEWORDS) {
      dataBytes[byteIdx++] = val;
    }
  }

  // Pad with alternating 0xEC, 0x11
  let pad = 0xec;
  while (byteIdx < DATA_CODEWORDS) {
    dataBytes[byteIdx++] = pad;
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  // Calculate EC
  const ecBytes = rsEncode(dataBytes, EC_CODEWORDS);

  // Combine data + EC
  const fullBytes = new Uint8Array(TOTAL_CODEWORDS);
  fullBytes.set(dataBytes, 0);
  fullBytes.set(ecBytes, DATA_CODEWORDS);

  // Build Matrix
  const matrix: boolean[][] = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));
  const isFunction: boolean[][] = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));

  function setFn(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Finder patterns (7x7) + Separators
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr < 0 || mr >= QR_SIZE || mc < 0 || mc >= QR_SIZE) continue;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const isSeparator = r === -1 || r === 7 || c === -1 || c === 7;
        setFn(mr, mc, !isSeparator && (isBorder || isCenter));
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, QR_SIZE - 7);
  placeFinder(QR_SIZE - 7, 0);

  // 2. Alignment patterns for Version 5: (row 30, col 30)
  function placeAlignment(row: number, col: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const mr = row + r;
        const mc = col + c;
        const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        setFn(mr, mc, isEdge || isCenter);
      }
    }
  }
  placeAlignment(30, 30);

  // 3. Timing patterns
  for (let i = 8; i < QR_SIZE - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setFn(4 * QR_VER + 9, 8, true);

  // 5. Reserve Format Information areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFn(8, i, false);
    if (!isFunction[i][8]) setFn(i, 8, false);
  }
  for (let i = QR_SIZE - 8; i < QR_SIZE; i++) {
    if (!isFunction[8][i]) setFn(8, i, false);
  }
  for (let i = QR_SIZE - 7; i < QR_SIZE; i++) {
    if (!isFunction[i][8]) setFn(i, 8, false);
  }

  // 6. Data Placement (up and down 2-column zig-zag)
  let bitPointer = 0;
  const fullBits: number[] = [];
  for (let i = 0; i < fullBytes.length; i++) {
    for (let b = 7; b >= 0; b--) {
      fullBits.push((fullBytes[i] >> b) & 1);
    }
  }

  let upward = true;
  for (let right = QR_SIZE - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip timing col
    const rows = upward
      ? Array.from({ length: QR_SIZE }, (_, i) => QR_SIZE - 1 - i)
      : Array.from({ length: QR_SIZE }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          const bit = bitPointer < fullBits.length ? fullBits[bitPointer++] : 0;
          // Apply Mask 0: (row + col) % 2 == 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  // 7. Format Information (Mask 0 + Error Correction L = 01 000 -> 15-bit BCH)
  // Mask 0, EC L = 0b01000 -> XOR 0b101010000010010
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  // Top-left
  setFn(8, 0, formatBits[0] === 1);
  setFn(8, 1, formatBits[1] === 1);
  setFn(8, 2, formatBits[2] === 1);
  setFn(8, 3, formatBits[3] === 1);
  setFn(8, 4, formatBits[4] === 1);
  setFn(8, 5, formatBits[5] === 1);
  setFn(8, 7, formatBits[6] === 1);
  setFn(8, 8, formatBits[7] === 1);
  setFn(7, 8, formatBits[8] === 1);
  setFn(5, 8, formatBits[9] === 1);
  setFn(4, 8, formatBits[10] === 1);
  setFn(3, 8, formatBits[11] === 1);
  setFn(2, 8, formatBits[12] === 1);
  setFn(1, 8, formatBits[13] === 1);
  setFn(0, 8, formatBits[14] === 1);

  // Right-top & Bottom-left
  for (let i = 0; i < 7; i++) {
    setFn(QR_SIZE - 1 - i, 8, formatBits[i] === 1);
  }
  for (let i = 0; i < 8; i++) {
    setFn(8, QR_SIZE - 8 + i, formatBits[7 + i] === 1);
  }

  return matrix;
}

/**
 * Generate crisp SVG path string for blueprint QR code
 */
export function generatePromptPayQrSvg(payload: string, size = 260): string {
  const matrix = encodeQRCodeMatrix(payload);
  const count = matrix.length;
  const padding = 2; // module margin
  const total = count + padding * 2;
  const cellSize = size / total;

  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (c + padding) * cellSize;
        const y = (r + padding) * cellSize;
        rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#ffffff" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="#040506" />
      ${rects}
    </svg>
  `.trim();
}
