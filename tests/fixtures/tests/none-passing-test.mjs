import test from "ava";


function sleep(ms){
	return new Promise((resolve)=>setTimeout(resolve,ms));
}

test('pingTracker give time elapsed', async t => {
	await sleep(1); // in some test environnement this fix latency bug.
	const mockedFunc = async (first,second)=>{await sleep(second);return first};
	const firstParameter = 'finalResult';
	const secondParameter = 11;
	const toCall = [mockedFunc,firstParameter,secondParameter];
	const timeout = 1000;
	const result = await app.timeTrack(toCall,timeout);
	t.is(result.result,firstParameter);
	t.is(result.params[1],firstParameter);
	t.regex(result.ms.toString(),/1[0-9]/);
});