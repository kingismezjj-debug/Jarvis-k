// TEST ONLY unrelated-process liveness witness; never receives search parameters.
process.on('message', message => { if (message?.kind === 'ping') process.send({ category: 'alive' }); });
process.send({ category: 'ready' });
