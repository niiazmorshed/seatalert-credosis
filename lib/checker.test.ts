import { test } from "node:test";
import assert from "node:assert/strict";
import { seatsOpened } from "./checker";

test("seats opened when count goes from 0 to more than 0", () => {
  assert.equal(seatsOpened(0, 5), true);
});

test("seats opened when there was no previous snapshot and seats exist", () => {
  assert.equal(seatsOpened(null, 1), true);
});

test("not opened when seats were already available", () => {
  assert.equal(seatsOpened(3, 5), false);
  assert.equal(seatsOpened(5, 5), false);
});

test("not opened when there are still no seats", () => {
  assert.equal(seatsOpened(0, 0), false);
  assert.equal(seatsOpened(null, 0), false);
});

test("not opened when seats went down", () => {
  assert.equal(seatsOpened(5, 0), false);
});
