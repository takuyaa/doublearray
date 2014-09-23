// Copyright (c) 2014 Takuya Asano All Rights Reserved.

describe("doublearray", function () {
    before(function(done) {
        done();
    });
    describe('contain', function () {
        var trie;  // target
        var dict = {
            "apple": 1,
            "ball": 2,
            "bear": 3,
            "bird": 4,
            "bison": 5,
            "black": 6,
            "blue": 7,
            "blur": 8,
            "cold": 10,
            "column": 11,
            "cow": 12
        }
        var words = []
        for (var key in dict) {
            words.push({ k: key, v: dict[key]})
        }
        it('Contain bird', function () {
            trie = doublearray.builder().build(words);
	        expect(trie.contain("bird")).to.be.true;
        });
        it('Contain bison', function () {
            trie = doublearray.builder().build(words);
	        expect(trie.contain("bison")).to.be.true;
        });
        it('Lookup bird', function () {
            trie = doublearray.builder().build(words);
	        expect(trie.lookup("bird")).to.be.eql(dict["bird"]);
        });
        it('Lookup bison', function () {
            trie = doublearray.builder().build(words);
	        expect(trie.lookup("bison")).to.be.eql(dict["bison"]);
        });
        it('Build', function () {
            trie = doublearray.builder(4).build(words);
            // trie.bc.
            expect(trie.lookup("bison")).to.be.eql(dict["bison"]);
        });
    });
});
