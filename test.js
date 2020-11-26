import test from 'ava';
import QuickLRU from '.';

const lruWithDuplicates = () => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('key', 'value');
	lru.set('keyDupe', 1);
	lru.set('keyDupe', 2);
	return lru;
};

const sleep = ms => new Promise(resolve => {
	setTimeout(resolve, ms);
});

test('main', t => {
	t.throws(() => {
		new QuickLRU(); // eslint-disable-line no-new
	}, /maxSize/);
});

test('wrong max age', t => {
	t.throws(() => {
		new QuickLRU({maxSize: 10, maxAge: 0}); // eslint-disable-line no-new
	}, /maxAge/);
});

test('.get() / .set()', t => {
	const lru = new QuickLRU({maxSize: 100});
	lru.set('foo', 1);
	lru.set('bar', 2);
	t.is(lru.get('foo'), 1);
	t.is(lru.size, 2);
});

test('.get() - limit', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	t.is(lru.get('1'), 1);
	t.is(lru.get('3'), undefined);
	lru.set('3', 3);
	lru.get('1');
	lru.set('4', 4);
	lru.get('1');
	lru.set('5', 5);
	t.true(lru.has('1'));
});

test('.set() - limit', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('foo', 1);
	lru.set('bar', 2);
	t.is(lru.get('foo'), 1);
	t.is(lru.get('bar'), 2);
	lru.set('baz', 3);
	lru.set('faz', 4);
	t.false(lru.has('foo'));
	t.false(lru.has('bar'));
	t.true(lru.has('baz'));
	t.true(lru.has('faz'));
	t.is(lru.size, 2);
});

test('.set() - update item', t => {
	const lru = new QuickLRU({maxSize: 100});
	lru.set('foo', 1);
	t.is(lru.get('foo'), 1);
	lru.set('foo', 2);
	t.is(lru.get('foo'), 2);
	t.is(lru.size, 1);
});

test('.has()', t => {
	const lru = new QuickLRU({maxSize: 100});
	lru.set('foo', 1);
	t.true(lru.has('foo'));
});

test('.peek()', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	t.is(lru.peek('1'), 1);
	lru.set('2', 2);
	t.is(lru.peek('1'), 1);
	t.is(lru.peek('3'), undefined);
	lru.set('3', 3);
	lru.set('4', 4);
	t.false(lru.has('1'));
});

test('.delete()', t => {
	const lru = new QuickLRU({maxSize: 100});
	lru.set('foo', 1);
	lru.set('bar', 2);
	t.true(lru.delete('foo'));
	t.false(lru.has('foo'));
	t.true(lru.has('bar'));
	t.false(lru.delete('foo'));
	t.is(lru.size, 1);
});

test('.delete() - limit', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('foo', 1);
	lru.set('bar', 2);
	t.is(lru.size, 2);
	t.true(lru.delete('foo'));
	t.false(lru.has('foo'));
	t.true(lru.has('bar'));
	lru.delete('bar');
	t.is(lru.size, 0);
});

test('.clear()', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('foo', 1);
	lru.set('bar', 2);
	lru.set('baz', 3);
	lru.clear();
	t.is(lru.size, 0);
});

test('.keys()', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	t.deepEqual([...lru.keys()].sort(), ['1', '2', '3']);
});

test('.keys() - accounts for duplicates', t => {
	const lru = lruWithDuplicates();
	t.deepEqual([...lru.keys()].sort(), ['key', 'keyDupe']);
});

test('.values()', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	t.deepEqual([...lru.values()].sort(), [1, 2, 3]);
});

test('.values() - accounts for duplicates', t => {
	const lru = lruWithDuplicates();
	t.deepEqual([...lru.values()].sort(), [2, 'value']);
});

test('.[Symbol.iterator]()', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	t.deepEqual([...lru].sort(), [
		['1', 1],
		['2', 2],
		['3', 3]
	]);
});

test('.[Symbol.iterator]() - accounts for duplicates', t => {
	const lru = lruWithDuplicates();
	t.deepEqual([...lru].sort(), [
		['key', 'value'],
		['keyDupe', 2]
	]);
});

test('.size', t => {
	const lru = new QuickLRU({maxSize: 100});
	lru.set('1', 1);
	lru.set('2', 2);
	t.is(lru.size, 2);
	lru.delete('1');
	t.is(lru.size, 1);
	lru.set('3', 3);
	t.is(lru.size, 2);
});

test('.size - accounts for duplicates', t => {
	const lru = lruWithDuplicates();
	t.is(lru.size, 2);
});

test('max size', t => {
	const lru = new QuickLRU({maxSize: 3});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	t.is(lru.size, 3);
	lru.set('4', 4);
	t.is(lru.size, 3);
});

test('checks total cache size does not exceed `maxSize`', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.get('1');
	t.is(lru.oldCache.has('1'), false);
});

test('`onEviction` option method is called after `maxSize` is exceeded', t => {
	const expectKey = '1';
	const expectValue = 1;
	let isCalled = false;
	let actualKey;
	let actualValue;

	const onEviction = (key, value) => {
		actualKey = key;
		actualValue = value;
		isCalled = true;
	};

	const lru = new QuickLRU({maxSize: 1, onEviction});
	lru.set(expectKey, expectValue);
	lru.set('2', 2);
	t.is(actualKey, expectKey);
	t.is(actualValue, expectValue);
	t.true(isCalled);
});

test('max age - should remove the item if has expired on call get() method upon the same key', async t => {
	const lru = new QuickLRU({maxSize: 10, maxAge: 90});
	lru.set('1', 'test');
	await sleep(200);
	t.is(lru.get('1'), undefined);
});

test('max age - a non-recent item can also expire', async t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 100});
	lru.set('1', 'test1');
	lru.set('2', 'test2');
	lru.set('3', 'test4');
	await sleep(200);
	t.is(lru.get('1'), undefined);
});

test('max age - setting the item again should refresh the expiration time', async t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 100});
	lru.set('1', 'test');
	await sleep(50);
	lru.set('1', 'test2');
	await sleep(50);
	t.is(lru.get('1'), 'test2');
});

test('max age - once an item expires, the eviction function should be called', async t => {
	t.timeout(1000);
	const expectKey = '1';
	const expectValue = 'test';

	let isCalled = false;
	let actualKey;
	let actualValue;
	const onEviction = (key, value) => {
		isCalled = true;
		actualKey = key;
		actualValue = value;
	};

	const lru = new QuickLRU({
		maxSize: 2,
		maxAge: 100,
		onEviction
	});

	lru.set(expectKey, expectValue);

	await sleep(200);

	t.is(lru.get('1'), undefined);
	t.true(isCalled);
	t.is(actualKey, expectKey);
	t.is(actualValue, expectValue);
});

test('max age - once an non-recent item expires, the eviction function should be called', async t => {
	t.timeout(1000);
	const expectKeys = ['1', '2'];
	const expectValues = ['test', 'test2'];

	let isCalled = false;
	const actualKeys = [];
	const actualValues = [];
	const onEviction = (key, value) => {
		isCalled = true;
		actualKeys.push(key);
		actualValues.push(value);
	};

	const lru = new QuickLRU({
		maxSize: 2,
		maxAge: 100,
		onEviction
	});

	lru.set('1', 'test');
	lru.set('2', 'test2');
	lru.set('3', 'test3');
	lru.set('4', 'test4');
	lru.set('5', 'test5');

	await sleep(200);

	t.is(lru.get('1'), undefined);
	t.true(isCalled);
	t.deepEqual(actualKeys, expectKeys);
	t.deepEqual(actualValues, expectValues);
});

test('max age - on resize, max aged items should also be evicted', async t => {
	t.timeout(1000);
	const expectKeys = ['1', '2', '3'];
	const expectValues = ['test', 'test2', 'test3'];

	let isCalled = false;
	const actualKeys = [];
	const actualValues = [];
	const onEviction = (key, value) => {
		isCalled = true;
		actualKeys.push(key);
		actualValues.push(value);
	};

	const lru = new QuickLRU({
		maxSize: 3,
		maxAge: 100,
		onEviction
	});

	lru.set('1', 'test');
	lru.set('2', 'test2');
	lru.set('3', 'test3');
	lru.set('4', 'test4');
	lru.set('5', 'test5');

	lru.resize(2);

	await sleep(200);

	t.is(lru.get('1'), undefined);
	t.true(isCalled);
	t.deepEqual(actualKeys, expectKeys);
	t.deepEqual(actualValues, expectValues);
});

test('max age - peek the item should also remove the item if has expired', async t => {
	const lru = new QuickLRU({maxSize: 10, maxAge: 100});
	lru.set('1', 'test');
	await sleep(200);
	t.is(lru.peek('1'), undefined);
});

test('max age - peeking the item should also remove expired items that are not recent', async t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 100});
	lru.set('1', 'test');
	lru.set('2', 'test');
	lru.set('3', 'test');
	await sleep(200);
	t.is(lru.peek('1'), undefined);
});

test('max age - non-recent items that are not exipred are also valid', async t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 200});
	lru.set('1', 'test');
	lru.set('2', 'test2');
	lru.set('3', 'test4');
	await sleep(100);
	t.is(lru.get('1'), 'test');
});

test('max age - has method should delete the item if expired and return false', async t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 100});
	lru.set('1', undefined);
	lru.set('2', 'test');
	lru.set('3', 'test');
	await sleep(200);
	t.false(lru.has('1'));
});

test('max age - has method should return true for undefined value that has expiration time', t => {
	const lru = new QuickLRU({maxSize: 2, maxAge: 100});
	lru.set('1', undefined);
	lru.set('2', 'test');
	lru.set('3', 'test');
	t.true(lru.has('1'));
});

test('entriesAscending enumerates cache items oldest-first', t => {
	const lru = new QuickLRU({maxSize: 3});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	lru.set('3', 7);
	lru.set('2', 8);
	t.deepEqual([...lru.entriesAscending()], [['1', 1], ['3', 7], ['2', 8]]);
});

test('entriesDescending enumerates cache items newest-first', t => {
	const lru = new QuickLRU({maxSize: 3});
	lru.set('t', 1);
	lru.set('q', 2);
	lru.set('a', 8);
	lru.set('t', 4);
	lru.set('v', 3);
	t.deepEqual([...lru.entriesDescending()], [['v', 3], ['t', 4], ['a', 8], ['q', 2]]);
});

test('resize removes older items', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	lru.resize(1);
	t.is(lru.peek('1'), undefined);
	t.is(lru.peek('3'), 3);
	lru.set('3', 4);
	t.is(lru.peek('3'), 4);
	lru.set('4', 5);
	t.is(lru.peek('4'), 5);
	t.is(lru.peek('2'), undefined);
});

test('resize omits evictions', t => {
	const calls = [];
	const onEviction = (...args) => calls.push(args);
	const lru = new QuickLRU({maxSize: 2, onEviction});

	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	lru.resize(1);
	t.true(calls.length >= 1);
	t.true(calls.some(([key]) => key === '1'));
});

test('resize increases capacity', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.resize(3);
	lru.set('3', 3);
	lru.set('4', 4);
	lru.set('5', 5);
	t.deepEqual([...lru.entriesAscending()], [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5]]);
});

test('resize does not conflict with the same number of items', t => {
	const lru = new QuickLRU({maxSize: 2});
	lru.set('1', 1);
	lru.set('2', 2);
	lru.set('3', 3);
	lru.resize(3);
	lru.set('4', 4);
	lru.set('5', 5);
	t.deepEqual([...lru.entriesAscending()], [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5]]);
});

test('resize checks parameter bounds', t => {
	const lru = new QuickLRU({maxSize: 2});
	t.throws(() => {
		lru.resize(-1);
	}, /maxSize/);
});
