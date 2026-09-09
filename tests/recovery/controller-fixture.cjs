// Unit tests only. Manual controller code never imports this synthetic receipt.
const R=require('./controller-receipt.cjs');
function success(){const receipt=R.empty();for(const k of ['resolved','identityVerified','handleOpened','killAttempted','killReturned','exitWaitStarted','exitObserved'])receipt.roleCounters.main[k]=1;Object.assign(receipt,{executed:true,allTerminationCallsCompleted:true,allTargetsExited:true,protectedSetPreserved:true,descendantCheckPassed:true,lastReachedStage:'controller_completed',cleanupOutcome:'completed'});return {executed:true,verified:true,receiptPublished:true,receipt,controllerCleanup:'completed'};}
module.exports={success};
