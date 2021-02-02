let connected = false;
const usernameInput = document.getElementById('username');
const button = document.getElementById('join_leave');
const container = document.getElementById('container');
const count = document.getElementById('count');

let room;
function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstElementChild;
        video.appendChild(track.attach());
    })
}

function connectButtonHandler(event){
    event.preventDefault();
    if(!connected) {
        const username = usernameInput.value;
        if(!username){
            alert('Enter your name before connection');
            return
        }
        button.disabled = true;
        button.innerHTML = 'Connecting...'
        connect(username).then(() => {
            button.disabled = false;
            button.innerHTML = 'Leave call...'
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
            button.disabled = false;
            button.innerHTML = 'Join call...'
        })
    }else{
        disconnect();
        button.innerHTML = 'Join call';
        connected = false;
    }
}

function connect(username){
    return new Promise(((resolve, reject) => {
        fetch('/login', {
            method: "POST",
            body: JSON.stringify({'username': username})
        }).then(res => res.json())
            .then(data => {
            return Twilio.Video.connect(data.token)
        }).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected)
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount()
            resolve();
        }).catch((err) => {
            reject(err);
        })
    }))
}

function updateParticipantCount(){
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
}

function participantConnected(participant){
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', "participant");

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv)

    let labelDiv = document.createElement('div');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv)

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if(publication.isSubscribed){
            trackSubscribed(tracksDiv, publication.track);
        }
    })
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track))
    participant.on('trackUnsubscribed', trackUnsubscribed)

    updateParticipantCount()
}

function participantDisconnected(participant){
    document.getElementById(participant.sid).remove();
    updateParticipantCount()
}

function trackSubscribed(div, track){
    div.appendChild(track.attach());
}

function trackUnsubscribed(track){
    track.detach().forEach(element => element.remove());
}

function disconnect() {
    room.disconnect();
    while (container.lastElementChild.id !== 'local')
        container.removeChild(container.lastChild);
    button.innerHTML = 'Join call';
    connected = false;
    updateParticipantCount();
}

addLocalVideo();
button.addEventListener('click', connectButtonHandler)