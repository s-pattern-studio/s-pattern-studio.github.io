import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelStep} from '../src/lib/wheelStep.ts';
test('one wheel burst including momentum moves exactly one card',()=>{
 let state={last:-Infinity,sum:0,used:false},steps=[];
 for(let t=0;t<1500;t+=16){state=wheelStep(state,t<50?120:8,t);steps.push(state.step);}
 assert.equal(steps.reduce((a,b)=>a+b,0),1);
 state=wheelStep(state,80,1800);assert.equal(state.step,1);
 state=wheelStep(state,-80,2100);assert.equal(state.step,-1);
});
