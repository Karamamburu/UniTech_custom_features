//выполнять в node.js
const sortedObj = Object.fromEntries(
	Object.entries(getNamesMapObject()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  );