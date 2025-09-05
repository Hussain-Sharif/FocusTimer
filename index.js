// Getting All ELEMENTS 
const sessionTitleInput=document.getElementById('session-title')
const sessionTitleLabel=document.getElementById("session-title-label")
const statusText=document.getElementById('status-text')
const titleDisplay=document.getElementById('title-display')
const sessionList=document.getElementById('Timer-sessions-container')
const countSpanEle=document.getElementById("distract-span-count")

const addMinBtn=document.getElementById("addMinBtn")
const subMinBtn=document.getElementById("subMinBtn")
const minValue=document.getElementById("minValue")

const addSecBtn=document.getElementById("addSecBtn")
const subSecBtn=document.getElementById("subSecBtn")
const secValue=document.getElementById("secValue")

const startBtn=document.getElementById('startBtn')
const resetBtn=document.getElementById('resetBtn')
const pauseBtn=document.getElementById('pauseBtn')
const timerPauseDiv=document.getElementById("timer-starter-div")

const audioPlayer=document.getElementById("audio-player")


// Logics starts here!!...

// Utility Stuff
let u_minSecCal=60
const u_allStatusEnum={
    notStarted:"Let's Get Started with Focus",
    isRunning:"Timer is Started",
    isPaused:"Timer is Paused!",
    isCompleted:"Timer is Completed!! Want to Focus again!",
}

// State creations
let s_totalTimeSet=10;
let s_targetEndTime = null;
let s_currentTimer=u_allStatusEnum.notStarted
let s_audioPaused=false;
let s_sessionDistractionCount=0
let s_listOfSessions=[]
let s_timeSetByUser=s_totalTimeSet


// setting the state with values 
window.onload=()=>{
    statusUI()
    distractionCountSpanEleUI()
    minValue.textContent=String(Math.floor(s_totalTimeSet/u_minSecCal)).padStart(2,'0');
    secValue.textContent=String(s_totalTimeSet%u_minSecCal).padStart(2,'0');    
}
console.log(document.visibilityState); // "visible"
console.log(document.hidden); // false 


// all event handlers

//For Minute
addMinBtn.addEventListener('click',function(){
    if(s_currentTimer!==u_allStatusEnum.notStarted || 
        s_totalTimeSet>=3600 || 
        s_totalTimeSet+60>=3600) return
    s_totalTimeSet+=60;
    s_timeSetByUser=s_totalTimeSet
    timeUI()
})
subMinBtn.addEventListener('click',function(){
    if(s_currentTimer!==u_allStatusEnum.notStarted || 
        s_totalTimeSet<60) return
    s_totalTimeSet-=60;
    s_timeSetByUser=s_totalTimeSet
    timeUI()
})


// For Seconds
addSecBtn.addEventListener('click',function(){
    if(s_currentTimer!==u_allStatusEnum.notStarted || 
        s_totalTimeSet>=3600) return
    s_totalTimeSet+=1;
    s_timeSetByUser=s_totalTimeSet
    timeUI()
})
subSecBtn.addEventListener('click',function(){
    if(s_currentTimer!==u_allStatusEnum.notStarted || 
        s_totalTimeSet<1) return
    s_totalTimeSet-=1;
    s_timeSetByUser=s_totalTimeSet
    timeUI()
})

// Start Timer
let timerSetUID;

function startBtnEventHandler(startTimer=true){

    if(s_totalTimeSet<1 || sessionTitleInput.value.length<5) return 

    titleDisplay.classList.remove("hidden")
    sessionTitleInput.classList.add("hidden")
    sessionTitleLabel.classList.add("hidden")
    titleDisplay.textContent=sessionTitleInput.value
    s_currentTimer=u_allStatusEnum.isRunning
    statusUI()
    pauseBtn.classList.remove("btn-disabled")
    pauseBtn.textContent="Pause"
    resetBtn.textContent="ReStart"

    // timerSetUID=setInterval(()=>{
    //     s_totalTimeSet-=1;
    //     timeUI()
    // },1000)
    s_targetEndTime = Date.now() + (s_totalTimeSet * 1000);
    timerSetUID = setInterval(() => {
        const remaining = Math.max(0, s_targetEndTime - Date.now());
        s_totalTimeSet = Math.ceil(remaining / 1000);
        timeUI();
        if (remaining <= 0) {
            completeTimer();
        }
    }, 100); 
    changeUIStartPause(startTimer)
}
startBtn.addEventListener("click",startBtnEventHandler)

//pause timer
function pauseBtnEventHandler(){
    if(s_currentTimer===u_allStatusEnum.isPaused){
        startBtnEventHandler()
    }else if(s_currentTimer===u_allStatusEnum.isRunning){
        clearInterval(timerSetUID)
        pauseBtn.textContent="Resume"
        s_currentTimer=u_allStatusEnum.isPaused
        statusUI()
    }
}
pauseBtn.addEventListener("click",pauseBtnEventHandler)

//reset Timer
resetBtn.addEventListener("click",()=>{
    clearInterval(timerSetUID)
    s_currentTimer=u_allStatusEnum.notStarted
    
    titleDisplay.classList.add("hidden")
    sessionTitleInput.classList.remove("hidden")
    sessionTitleLabel.classList.remove("hidden")
    sessionTitleInput.value=''
    
    if(s_timeSetByUser !== s_totalTimeSet && s_totalTimeSet && s_totalTimeSet < s_timeSetByUser) {
        listOfAllSessions() 
    }
    s_totalTimeSet=25*60
    s_timeSetByUser = 25*60
    statusUI()
    timeUI()
    changeUIStartPause(false)
    startBtn.classList.add('btn-disabled')
})

//Completion of Timer
function completeTimer(){
    clearInterval(timerSetUID)
    s_currentTimer=u_allStatusEnum.isCompleted
    pauseBtn.classList.add("btn-disabled")
    resetBtn.textContent="ReStart the Timer Again"

    statusUI()
    playCompletionAudio()
    listOfAllSessions()
    console.log("Timer is Completed s_targetEndTime,s_totalTimeSet,s_currentTimer:",s_targetEndTime,s_totalTimeSet,s_currentTimer)
}


function playCompletionAudio() {
    // Longer celebration sound when timer completes
    const alertAudio = new Audio('audios/timer-completion.wav');
    alertAudio.currentTime = 0;
    alertAudio.volume = 0.5;
    alertAudio.play().catch(err => console.log('Completion audio failed:', err));
}


// Page Visibility API
document.addEventListener("visibilitychange", async(event) => {

    if(document.visibilityState==='visible' && s_audioPaused){ // Remove this to have manual Resume click by user.
        s_currentTimer=u_allStatusEnum.isPaused
        console.log("Is visible so getting started")
        pauseBtnEventHandler()
    }
    
  if(document.visibilityState==='hidden' && s_currentTimer===u_allStatusEnum.isRunning){
      pauseBtnEventHandler()
      audioPlayer.currentTime = 0;
    try {
        await audioPlayer.play();   
        s_audioPaused=!audioPlayer.paused
        s_currentTimer=u_allStatusEnum.isPaused
        s_sessionDistractionCount++;
        distractionCountSpanEleUI()
        console.log("Restarted audio from 0 (hidden)");
    } catch (err) {
      console.log("Play failed:", err);
    }
  }else{
    if(s_audioPaused) 
        audioPlayer.pause()
    console.log("Inside-V")
  }
});



// Update UI 
function timeUI(){
    minValue.textContent=String(Math.floor(s_totalTimeSet/u_minSecCal)).padStart(2,'0');
    secValue.textContent=String(s_totalTimeSet%u_minSecCal).padStart(2,'0');  
}

sessionTitleInput.addEventListener('input', function(event) {
    console.log(event.target.value,event.target.value.length)
    if(event.target.value.length >= 5) {
        startBtn.classList.remove("btn-disabled")
        startBtn.disabled = false
    } else {
        startBtn.classList.add("btn-disabled")
        startBtn.disabled = true
    }
})

function distractionCountSpanEleUI(){
    countSpanEle.textContent=s_sessionDistractionCount;
}


function changeUIStartPause(isStarted){
    if(isStarted){
        startBtn.classList.add('btn-disabled')
        timerPauseDiv.classList.remove('hidden')
    }else{
        startBtn.classList.remove('btn-disabled')
        timerPauseDiv.classList.add('hidden')
    }
}

function statusUI(){
    statusText.textContent=s_currentTimer;
    if(s_currentTimer===u_allStatusEnum.isCompleted){
        statusText.classList.add("status-completed")
    }
}


function listOfAllSessions(){
    

     sessionList.innerHTML=''
    
    s_listOfSessions=[...s_listOfSessions,{
        sessionTitleName:titleDisplay.innerHTML,
        timerLeftOut:s_totalTimeSet,
        startTimerSetByUser:s_timeSetByUser,
        noOfDistractions:s_sessionDistractionCount
    }]

    s_listOfSessions.forEach(eachTimerSession => {
        const {sessionTitleName,timerLeftOut,startTimerSetByUser,noOfDistractions}=eachTimerSession

        const eachSession=document.createElement('li')
        const titleOfSession=document.createElement('p')
        const elpasedTime=document.createElement('p')
        const noTimesDistracted=document.createElement('p')

        const getMinSec=(time)=>{
            let minValue=String(Math.floor(time/u_minSecCal)).padStart(2,'0');
            let secValue=String(time%u_minSecCal).padStart(2,'0');
            return {
                min:minValue,
                sec:secValue
            }
        }

        titleOfSession.textContent=`Session Name: ${sessionTitleName}`
        elpasedTime.textContent=`${timerLeftOut?`Timer is abrupted at ${getMinSec(timerLeftOut).min}:${getMinSec(timerLeftOut).sec}`:`Timer Completed Successfully for ${getMinSec(startTimerSetByUser).min}:${getMinSec(startTimerSetByUser).sec}` }`
        noTimesDistracted.textContent=`No of Times Distracted: ${noOfDistractions}`
        eachSession.appendChild(titleOfSession)
        eachSession.appendChild(elpasedTime)
        eachSession.appendChild(noTimesDistracted)

        eachSession.classList.add('session-item')
        titleOfSession.classList.add('session-title')
        elpasedTime.classList.add('session-time')
        noTimesDistracted.classList.add('session-distractions')

        
        sessionList.appendChild(eachSession)
    });

    

    s_sessionDistractionCount=0
    distractionCountSpanEleUI()    


}

