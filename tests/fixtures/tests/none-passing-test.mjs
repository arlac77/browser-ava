import test from "ava";


function sleep(ms){
	return new Promise((resolve)=>setTimeout(resolve,ms));
}

async function timeTrack(arrayFuncAndParams,timeout){
	return Promise.race([
		new Promise(resolve => setTimeout(
				()=>resolve({ms:timeout,params:arrayFuncAndParams,timeout:true}),
				timeout
			)),
		new Promise(async resolve=>{
			const startTime = Date.now();
			const func = arrayFuncAndParams[0];
			const params = arrayFuncAndParams.slice(1);

			const res = await func(...params);
			const endTime = Date.now();
			const elapsed = endTime - startTime;
			resolve({ms:elapsed,params:arrayFuncAndParams,result:res});
		})]
	);
}

test('pingTracker give time elapsed', async t => {
	await sleep(1); // in some test environnement this fix latency bug.
	const mockedFunc = async (first,second)=>{await sleep(second);return first};
	const firstParameter = 'finalResult';
	const secondParameter = 11;
	const toCall = [mockedFunc,firstParameter,secondParameter];
	const timeout = 1000;
	const result = await timeTrack(toCall,timeout);
	t.is(result.result,firstParameter);
	t.is(result.params[1],firstParameter);

	console.log(result);
	t.regex(result.ms.toString(),/1[0-9]/);
});