
async function testEvent(f, eventName, expectedValues) {
    const tx = await f();
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === eventName);

    for (let n = 0; n < expectedValues.length; n++) {
        expect(event.args[n]).to.equal(expectedValues[n]);
    }
}

module.exports = testEvent;