export type ArrayBuffer = IntArrayBuffer | UintArrayBuffer;
export type IntArrayBuffer = Int8Array | Int16Array | Int32Array;
export type UintArrayBuffer = Uint8Array | Uint16Array | Uint32Array;

export interface BC {
  getBaseBuffer: () => ArrayBuffer;
  getCheckBuffer: () => ArrayBuffer;
  loadBaseBuffer: (base_buffer: ArrayBuffer) => void;
  loadCheckBuffer: (check_buffer: ArrayBuffer) => void;
  size: () => number;
  getBase: (index: number) => number;
  getCheck: (index: number) => number;
  setBase: (index: number, base_value: number) => void;
  setCheck: (index: number, check_value: number) => void;
  setFirstUnusedNode: (index: number) => void;
  getFirstUnusedNode: () => number;
  shrink: () => void;
  calc: () => BCCalc;
  dump: () => string;
}

export interface DoubleArrayBuilder {
  /**
   * Append a key to initialize set
   * (This method should be called by dictionary ordered key)
   *
   * @param {String} key
   * @param {Number} value Integer value from 0 to max signed integer number - 1
   */
  append: (key: Uint8Array, record: number) => void;

  /**
   * Build double array for given keys
   *
   * @param {Array} keys Array of keys. A key is a Object which has properties 'k', 'v'.
   * 'k' is a key string, 'v' is a record assigned to that key.
   * @return {DoubleArray} Compiled double array
   */
  build: (keys: Key[], sorted: boolean) => DoubleArray | number;

  /**
   * Append nodes to BASE and CHECK array recursively
   */
  _build: (
    parent_index: number,
    position: number,
    start: number,
    length: number,
  ) => void;

  getChildrenInfo: (
    position: number,
    start: number,
    length: number,
  ) => Int32Array;

  setBC: (
    parent_id: number,
    children_info: Int32Array,
    _base: number,
  ) => void;

  /**
   * Find BASE value that all children are allocatable in double array's region
   */
  findAllocatableBase: (children_info: Int32Array) => number;

  /**
   * Check this double array index is unused or not
   */
  isUnusedNode: (index: number) => boolean;
}

export interface DoubleArray {
  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Boolean} True if this trie contains a given key
   */
  contain: (key: string) => boolean;

  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Number} Record value assgned to this key, -1 if this key does not contain
   */
  lookup: (key: string) => number;

  /**
   * Common prefix search
   *
   * @param {String} key
   * @return {Array} Each result object has 'k' and 'v' (key and record,
   * respectively) properties assigned to matched string
   */
  commonPrefixSearch: (key: string) => void;

  traverse: (parent: number, code: number) => number;

  size: () => number;

  calc: () => BCCalc;

  dump: () => string;
}

export interface BCCalc {
  all: number;
  unused: number;
  efficiency: number;
}

export interface BCValue {
  signed: boolean;
  bytes: number;
  array: ArrayBuffer;
}

export interface Key {
  k: Uint8Array | string | null;
  v: number;
}
