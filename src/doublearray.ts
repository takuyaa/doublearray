// Copyright (c) 2014 Takuya Asano All Rights Reserved.

import type {
  ArrayBuffer,
  BC,
  BCValue,
  DoubleArrayBuilder,
  Key,
} from "./types";

let doublearray;

(() => {
  // "use strict";

  const TERM_CHAR = "\u0000", // terminal character
    TERM_CODE = 0, // terminal character code
    ROOT_ID = 0, // index of root node
    NOT_FOUND = -1, // traverse() returns if no nodes found
    BASE_SIGNED = true,
    CHECK_SIGNED = true,
    BASE_BYTES = 4,
    CHECK_BYTES = 4,
    MEMORY_EXPAND_RATIO = 2;

  let bc_member: BC;
  let keys_member: Key[];

  const newBC = function (initial_size?: number): BC {
    if (initial_size === undefined || initial_size === null) {
      initial_size = 1024;
    }

    const initBase = function (_base: ArrayBuffer, start: number, end: number) { // 'end' index does not include
      for (let i = start; i < end; i++) {
        _base[i] = -i + 1; // inversed previous empty node index
      }
      if (0 < check.array[check.array.length - 1]) {
        var last_used_id = check.array.length - 2;
        while (0 < check.array[last_used_id]) {
          last_used_id--;
        }
        _base[start] = -last_used_id;
      }
    };

    const initCheck = function (
      _check: ArrayBuffer,
      start: number,
      end: number,
    ) {
      for (let i = start; i < end; i++) {
        _check[i] = -i - 1; // inversed next empty node index
      }
    };

    var realloc = function (min_size: number) {
      // expand arrays size by given ratio
      const new_size: number = min_size * MEMORY_EXPAND_RATIO;
      // console.log('re-allocate memory to ' + new_size);

      var base_new_array = newArrayBuffer(base.signed, base.bytes, new_size);
      initBase(base_new_array, base.array.length, new_size); // init BASE in new range
      base_new_array.set(base.array);
      // base.array = null;  // explicit GC
      base.array = base_new_array;

      var check_new_array = newArrayBuffer(check.signed, check.bytes, new_size);
      initCheck(check_new_array, check.array.length, new_size); // init CHECK in new range
      check_new_array.set(check.array);
      // check.array = null;  // explicit GC
      check.array = check_new_array;
    };

    var first_unused_node = ROOT_ID + 1;

    var base: BCValue = {
      signed: BASE_SIGNED,
      bytes: BASE_BYTES,
      array: newArrayBuffer(BASE_SIGNED, BASE_BYTES, initial_size),
    };

    var check: BCValue = {
      signed: CHECK_SIGNED,
      bytes: CHECK_BYTES,
      array: newArrayBuffer(CHECK_SIGNED, CHECK_BYTES, initial_size),
    };

    // init root node
    base.array[ROOT_ID] = 1;
    check.array[ROOT_ID] = ROOT_ID;

    // init BASE
    initBase(base.array, ROOT_ID + 1, base.array.length);

    // init CHECK
    initCheck(check.array, ROOT_ID + 1, check.array.length);

    return {
      getBaseBuffer: function () {
        return base.array;
      },
      getCheckBuffer: function () {
        return check.array;
      },
      loadBaseBuffer: (base_buffer) => {
        base.array = base_buffer;
        // return this;
      },
      loadCheckBuffer: (check_buffer) => {
        check.array = check_buffer;
        // return this;
      },
      size: function () {
        return Math.max(base.array.length, check.array.length);
      },
      getBase: function (index: number) {
        if (base.array.length - 1 < index) {
          return -index + 1;
          // realloc(index);
        }
        // if (!Number.isFinite(base.array[index])) {
        //     console.log('getBase:' + index);
        //     throw 'getBase' + index;
        // }
        return base.array[index];
      },
      getCheck: function (index: number) {
        if (check.array.length - 1 < index) {
          return -index - 1;
          // realloc(index);
        }
        // if (!Number.isFinite(check.array[index])) {
        //     console.log('getCheck:' + index);
        //     throw 'getCheck' + index;
        // }
        return check.array[index];
      },
      setBase: function (index: number, base_value: number) {
        if (base.array.length - 1 < index) {
          realloc(index);
        }
        base.array[index] = base_value;
      },
      setCheck: function (index: number, check_value: number) {
        if (check.array.length - 1 < index) {
          realloc(index);
        }
        check.array[index] = check_value;
      },
      setFirstUnusedNode: function (index: number) {
        // if (!Number.isFinite(index)) {
        //     throw 'assertion error: setFirstUnusedNode ' + index + ' is not finite number';
        // }
        first_unused_node = index;
      },
      getFirstUnusedNode: function () {
        // if (!Number.isFinite(first_unused_node)) {
        //     throw 'assertion error: getFirstUnusedNode ' + first_unused_node + ' is not finite number';
        // }
        return first_unused_node;
      },
      shrink: function () {
        var last_index = this.size() - 1;
        while (true) {
          if (0 <= check.array[last_index]) {
            break;
          }
          last_index--;
        }
        base.array = base.array.subarray(0, last_index + 2); // keep last unused node
        check.array = check.array.subarray(0, last_index + 2); // keep last unused node
      },
      calc: function () {
        var unused_count = 0;
        var size = check.array.length;
        for (var i = 0; i < size; i++) {
          if (check.array[i] < 0) {
            unused_count++;
          }
        }
        return {
          all: size,
          unused: unused_count,
          efficiency: (size - unused_count) / size,
        };
      },
      dump: function () {
        // for debug
        var dump_base = "";
        var dump_check = "";

        var i;
        for (i = 0; i < base.array.length; i++) {
          dump_base = dump_base + " " + this.getBase(i);
        }
        for (i = 0; i < check.array.length; i++) {
          dump_check = dump_check + " " + this.getCheck(i);
        }

        console.log("base:" + dump_base);
        console.log("chck:" + dump_check);

        return "base:" + dump_base + " chck:" + dump_check;
      },
    };
  };

  /**
   * Factory method of double array
   */
  const DoubleArrayBuilder = (initial_size: number): DoubleArrayBuilder => {
    bc_member = newBC(initial_size); // BASE and CHECK
    keys_member = [];

    const append = (key: Uint8Array, record: number) => {
      keys_member.push({ k: key, v: record });
    };

    const build = (keys: Key[], sorted: boolean) => {
      if (keys == null) {
        keys = keys_member;
      }

      if (keys == null) {
        return DoubleArray(bc_member);
      }

      if (sorted == null) {
        sorted = false;
      }

      // Convert key string to ArrayBuffer
      var buff_keys = keys.map(function (k) {
        return {
          k: stringToUtf8Bytes(k.k + TERM_CHAR),
          v: k.v,
        };
      });

      // Sort keys by byte order
      if (sorted) {
        keys_member = buff_keys;
      } else {
        keys_member = buff_keys.sort((k1, k2) => {
          const b1 = k1.k;
          const b2 = k2.k;
          if (b1 === null && b2 === null) return 0;
          else if (b1 === null) return -1;
          else if (b2 === null) return 1;

          const min_length = Math.min(b1.length, b2.length);
          for (var pos = 0; pos < min_length; pos++) {
            if (b1[pos] === b2[pos]) {
              continue;
            }
            return b1[pos] - b2[pos];
          }
          return b1.length - b2.length;
        });
      }

      // buff_keys = null; // explicit GC

      _build(ROOT_ID, 0, 0, keys_member.length);
      return DoubleArray(bc_member);
    };

    const _build = (
      parent_index: number,
      position: number,
      start: number,
      length: number,
    ) => {
      var children_info = getChildrenInfo(position, start, length);
      var _base = findAllocatableBase(children_info);

      setBC(parent_index, children_info, _base);

      for (var i = 0; i < children_info.length; i = i + 3) {
        var child_code = children_info[i];
        if (child_code === TERM_CODE) {
          continue;
        }
        var child_start = children_info[i + 1];
        var child_len = children_info[i + 2];
        var child_index = _base + child_code;
        _build(child_index, position + 1, child_start, child_len);
      }
    };

    const getChildrenInfo = (
      position: number,
      start: number,
      length: number,
    ) => {
      const start_key = keys_member[start];
      if (start_key.k === null) return new Int32Array();
      const start_key_k = start_key.k[position];
      var current_char = typeof start_key_k === "number"
        ? start_key_k.toString()
        : start_key_k;
      var i = 0;
      var children_info = new Int32Array(length * 3);

      children_info[i++] = parseInt(current_char); // char (current)
      children_info[i++] = start; // start index (current)

      var next_pos = start;
      var start_pos = start;
      for (; next_pos < start + length; next_pos++) {
        const next_key = keys_member[next_pos];
        if (next_key.k === null) return new Int32Array();
        const next_key_k = next_key.k[position];
        var next_char = typeof next_key_k === "number"
          ? next_key_k.toString()
          : next_key_k;
        if (current_char !== next_char) {
          children_info[i++] = next_pos - start_pos; // length (current)

          children_info[i++] = parseInt(next_char); // char (next)
          children_info[i++] = next_pos; // start index (next)
          current_char = next_char;
          start_pos = next_pos;
        }
      }
      children_info[i++] = next_pos - start_pos;
      children_info = children_info.subarray(0, i);

      return children_info;
    };

    const setBC = (
      parent_id: number,
      children_info: Int32Array,
      _base: number,
    ) => {
      var bc = bc_member;

      bc.setBase(parent_id, _base); // Update BASE of parent node

      var i;
      for (i = 0; i < children_info.length; i = i + 3) {
        var code = children_info[i];
        var child_id = _base + code;

        // Update linked list of unused nodes

        // Assertion
        // if (child_id < 0) {
        //     throw 'assertion error: child_id is negative'
        // }

        var prev_unused_id = -bc.getBase(child_id);
        var next_unused_id = -bc.getCheck(child_id);
        // if (prev_unused_id < 0) {
        //     throw 'assertion error: setBC'
        // }
        // if (next_unused_id < 0) {
        //     throw 'assertion error: setBC'
        // }
        if (child_id !== bc.getFirstUnusedNode()) {
          bc.setCheck(prev_unused_id, -next_unused_id);
        } else {
          // Update first_unused_node
          bc.setFirstUnusedNode(next_unused_id);
        }
        bc.setBase(next_unused_id, -prev_unused_id);

        var check = parent_id; // CHECK is parent node index
        bc.setCheck(child_id, check); // Update CHECK of child node

        // Update record
        if (code === TERM_CODE) {
          var start_pos = children_info[i + 1];
          // var len = children_info[i + 2];
          // if (len != 1) {
          //     throw 'assertion error: there are multiple terminal nodes. len:' + len;
          // }
          var value = keys_member[start_pos].v;

          if (value == null) {
            value = 0;
          }

          var base = -value - 1; // BASE is inverted record value
          bc.setBase(child_id, base); // Update BASE of child(leaf) node
        }
      }
    };

    const findAllocatableBase = (children_info: Int32Array) => {
      var bc = bc_member;

      // Assertion: keys are sorted by byte order
      // var c = -1;
      // for (var i = 0; i < children_info.length; i = i + 3) {
      //     if (children_info[i] < c) {
      //         throw 'assertion error: not sort key'
      //     }
      //     c = children_info[i];
      // }

      // iterate linked list of unused nodes
      var _base;
      var curr = bc.getFirstUnusedNode(); // current index
      // if (curr < 0) {
      //     throw 'assertion error: getFirstUnusedNode returns negative value'
      // }

      while (true) {
        _base = curr - children_info[0];

        if (_base < 0) {
          curr = -bc.getCheck(curr); // next

          // if (curr < 0) {
          //     throw 'assertion error: getCheck returns negative value'
          // }

          continue;
        }

        var empty_area_found = true;
        for (var i = 0; i < children_info.length; i = i + 3) {
          var code = children_info[i];
          var candidate_id = _base + code;

          if (!isUnusedNode(candidate_id)) {
            // candidate_id is used node
            // next
            curr = -bc.getCheck(curr);
            // if (curr < 0) {
            //     throw 'assertion error: getCheck returns negative value'
            // }

            empty_area_found = false;
            break;
          }
        }
        if (empty_area_found) {
          // Area is free
          return _base;
        }
      }
    };

    const isUnusedNode = (index: number) => {
      var bc = bc_member;
      var check = bc.getCheck(index);

      // if (index < 0) {
      //     throw 'assertion error: isUnusedNode index:' + index;
      // }

      if (index === ROOT_ID) {
        // root node
        return false;
      }
      if (check < 0) {
        // unused
        return true;
      }

      // used node (incl. leaf)
      return false;
    };

    return {
      append,
      build,
      _build,
      getChildrenInfo,
      setBC,
      findAllocatableBase,
      isUnusedNode,
    };
  };

  /**
   * Factory method of double array
   */
  const DoubleArray = (bc: BC) => {
    bc_member = bc; // BASE and CHECK
    bc_member.shrink();

    const contain = (key: string): boolean => {
      var bc = bc_member;

      key += TERM_CHAR;
      var buffer = stringToUtf8Bytes(key);
      if (buffer === null) return false;

      var parent = ROOT_ID;
      var child = NOT_FOUND;

      for (var i = 0; i < buffer.length; i++) {
        var code = buffer[i];

        child = traverse(parent, code);
        if (child === NOT_FOUND) {
          return false;
        }

        if (bc.getBase(child) <= 0) {
          // leaf node
          return true;
        } else {
          // not leaf
          parent = child;
          continue;
        }
      }
      return false;
    };

    const lookup = (key: string): number => {
      key += TERM_CHAR;
      var buffer = stringToUtf8Bytes(key);
      if (buffer === null) return -1;

      var parent = ROOT_ID;
      var child = NOT_FOUND;

      for (var i = 0; i < buffer.length; i++) {
        var code = buffer[i];
        child = traverse(parent, code);
        if (child === NOT_FOUND) {
          return NOT_FOUND;
        }
        parent = child;
      }

      var base = bc_member.getBase(child);
      if (base <= 0) {
        // leaf node
        return -base - 1;
      } else {
        // not leaf
        return NOT_FOUND;
      }
    };

    const commonPrefixSearch = (key: string) => {
      var buffer = stringToUtf8Bytes(key);
      if (buffer === null) return;

      var parent = ROOT_ID;
      var child = NOT_FOUND;

      var result = [];

      for (var i = 0; i < buffer.length; i++) {
        var code = buffer[i];

        child = traverse(parent, code);

        if (child !== NOT_FOUND) {
          parent = child;

          // look forward by terminal character code to check this node is a leaf or not
          var grand_child = traverse(child, TERM_CODE);

          if (grand_child !== NOT_FOUND) {
            var base = bc_member.getBase(grand_child);

            var r: Partial<Key> = {};

            if (base <= 0) {
              // If child is a leaf node, add record to result
              r.v = -base - 1;
            }

            // If child is a leaf node, add word to result
            r.k = utf8BytesToString(arrayCopy(buffer, 0, i + 1));

            result.push(r);
          }
          continue;
        } else {
          break;
        }
      }

      return result;
    };

    const traverse = (parent: number, code: number) => {
      var child = bc_member.getBase(parent) + code;
      if (bc_member.getCheck(child) === parent) {
        return child;
      } else {
        return NOT_FOUND;
      }
    };

    const size = () => {
      return bc_member.size();
    };

    const calc = () => {
      return bc_member.calc();
    };

    const dump = () => {
      return bc_member.dump();
    };

    return {
      contain,
      lookup,
      commonPrefixSearch,
      traverse,
      size,
      calc,
      dump,
    };
  };

  // Array utility functions

  const newArrayBuffer = (
    signed: boolean,
    bytes: number,
    size: number,
  ): ArrayBuffer => {
    if (signed) {
      switch (bytes) {
        case 1:
          return new Int8Array(size);
        case 2:
          return new Int16Array(size);
        case 4:
          return new Int32Array(size);
        default:
          throw new RangeError(
            "Invalid newArray parameter element_bytes:" + bytes,
          );
      }
    } else {
      switch (bytes) {
        case 1:
          return new Uint8Array(size);
        case 2:
          return new Uint16Array(size);
        case 4:
          return new Uint32Array(size);
        default:
          throw new RangeError(
            "Invalid newArray parameter element_bytes:" + bytes,
          );
      }
    }
  };

  const arrayCopy = (src: ArrayBuffer, src_offset: number, length: number) => {
    var buffer = new ArrayBuffer(length);
    var dstU8 = new Uint8Array(buffer, 0, length);
    var srcU8 = src.subarray(src_offset, length);
    dstU8.set(srcU8);
    return dstU8;
  };

  /**
   * Convert String (UTF-16) to UTF-8 ArrayBuffer
   *
   * @param {String} str UTF-16 string to convert
   * @return {Uint8Array} Byte sequence encoded by UTF-8
   */
  var stringToUtf8Bytes = function (str: string) {
    // Max size of 1 character is 4 bytes
    const bytes = new Uint8Array(new ArrayBuffer(str.length * 4));

    let i = 0, j = 0;

    while (i < str.length) {
      var unicode_code;

      var utf16_code = str.charCodeAt(i++);
      if (utf16_code >= 0xD800 && utf16_code <= 0xDBFF) {
        // surrogate pair
        var upper = utf16_code; // high surrogate
        var lower = str.charCodeAt(i++); // low surrogate

        if (lower >= 0xDC00 && lower <= 0xDFFF) {
          unicode_code = (upper - 0xD800) * (1 << 10) + (1 << 16) +
            (lower - 0xDC00);
        } else {
          // malformed surrogate pair
          return null;
        }
      } else {
        // not surrogate code
        unicode_code = utf16_code;
      }

      if (unicode_code < 0x80) {
        // 1-byte
        bytes[j++] = unicode_code;
      } else if (unicode_code < (1 << 11)) {
        // 2-byte
        bytes[j++] = (unicode_code >>> 6) | 0xC0;
        bytes[j++] = (unicode_code & 0x3F) | 0x80;
      } else if (unicode_code < (1 << 16)) {
        // 3-byte
        bytes[j++] = (unicode_code >>> 12) | 0xE0;
        bytes[j++] = ((unicode_code >> 6) & 0x3f) | 0x80;
        bytes[j++] = (unicode_code & 0x3F) | 0x80;
      } else if (unicode_code < (1 << 21)) {
        // 4-byte
        bytes[j++] = (unicode_code >>> 18) | 0xF0;
        bytes[j++] = ((unicode_code >> 12) & 0x3F) | 0x80;
        bytes[j++] = ((unicode_code >> 6) & 0x3F) | 0x80;
        bytes[j++] = (unicode_code & 0x3F) | 0x80;
      } else {
        // malformed UCS4 code
      }
    }

    return bytes.subarray(0, j);
  };

  /**
   * Convert UTF-8 ArrayBuffer to String (UTF-16)
   *
   * @param {Uint8Array} bytes UTF-8 byte sequence to convert
   * @return {String} String encoded by UTF-16
   */
  var utf8BytesToString = function (bytes: Uint8Array) {
    var str = "";
    var code, b1, b2, b3, b4, upper, lower;
    var i = 0;

    while (i < bytes.length) {
      b1 = bytes[i++];

      if (b1 < 0x80) {
        // 1 byte
        code = b1;
      } else if ((b1 >> 5) === 0x06) {
        // 2 bytes
        b2 = bytes[i++];
        code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
      } else if ((b1 >> 4) === 0x0e) {
        // 3 bytes
        b2 = bytes[i++];
        b3 = bytes[i++];
        code = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      } else {
        // 4 bytes
        b2 = bytes[i++];
        b3 = bytes[i++];
        b4 = bytes[i++];
        code = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) |
          (b4 & 0x3f);
      }

      if (code < 0x10000) {
        str += String.fromCharCode(code);
      } else {
        // surrogate pair
        code -= 0x10000;
        upper = 0xD800 | (code >> 10);
        lower = 0xDC00 | (code & 0x3FF);
        str += String.fromCharCode(upper, lower);
      }
    }

    return str;
  };

  // public methods
  doublearray = {
    builder: (initial_size: number) => {
      return DoubleArrayBuilder(initial_size);
    },
    load: (base_buffer: ArrayBuffer, check_buffer: ArrayBuffer) => {
      var bc = newBC(0);
      bc.loadBaseBuffer(base_buffer);
      bc.loadCheckBuffer(check_buffer);
      return DoubleArray(bc);
    },
  };

  if ("undefined" === typeof module) {
    // In browser
    // @ts-ignore
    window.doublearray = doublearray;
  } else {
    // In node
    module.exports = doublearray;
  }
})();

export default doublearray;
