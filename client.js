const socket = io.connect("http://192.168.1.72:3000");
let roomsContainer = document.querySelector("#rooms-container");
let roomCopy = document.querySelector("#room-copy");
let rooms = document.querySelector("#rooms");
let gameRoomMenu = document.querySelector("#gameRoomMenu");
let teamAContainer = document.querySelector("#team-a");
let teamBContainer = document.querySelector("#team-b");
let teamPlayerCopy = document.querySelector("#gameMenu-team-player-copy");

let roomsList = [];
let gameRoomName = ""; // just name so can refer back to rooms list for info

function updateRooms(backEndRooms, roomsList, updatingTeams) {
	// backEndRooms = { "some name" : {peopleWaiting: 3}, "another name" : {...} }
	function findAddedKeys(firstObject, comparedObject) {
		// PROBLEMS WITH THIS FUNCTION
		let differentObjectKeys = [];
		for (let key in comparedObject) {
			if (!firstObject.hasOwnProperty(key)) {
				differentObjectKeys.push(key);
			}
		}
		return [...differentObjectKeys];
	}
	let removedRooms = [...findAddedKeys(backEndRooms, roomsList)];
	let addedRooms = [...findAddedKeys(roomsList, backEndRooms)];

	//do some fancy magic for finding differences in both teams
	//then updating the teams accordingly
	if (gameRoomName != "" && updatingTeams) {
		let updatedRoomTeams = backEndRooms[gameRoomName].teams;
		let backEndRoomTeams = roomsList[gameRoomName].teams;
		let aTeamRemovedPlayers = findAddedKeys(
			updatedRoomTeams.a,
			backEndRoomTeams.a
		);
		let aTeamAddedPlayers = findAddedKeys(
			backEndRoomTeams.a,
			updatedRoomTeams.a
		);
		let bTeamRemovedPlayers = findAddedKeys(
			updatedRoomTeams.b,
			backEndRoomTeams.b
		);
		let bTeamAddedPlayers = findAddedKeys(
			backEndRoomTeams.b,
			updatedRoomTeams.b
		);

		console.log(
			`${aTeamAddedPlayers} + ateamadded, ${aTeamRemovedPlayers} + ateamremoved, ${bTeamAddedPlayers} + bteamadded, ${bTeamRemovedPlayers} + bteamremoved`
		);
		aTeamRemovedPlayers.forEach((player) => {
			removeTeamElement(backEndRoomTeams.a[player], "a");
		});
		aTeamAddedPlayers.forEach((player) => {
			addTeamElement(updatedRoomTeams.a[player], "a");
		});
		bTeamRemovedPlayers.forEach((player) => {
			removeTeamElement(backEndRoomTeams.b[player], "b");
		});
		bTeamAddedPlayers.forEach((player) => {
			addTeamElement(updatedRoomTeams.b[player], "b");
		});
	}

	//remove all elments with names of removedRooms[]
	removedRooms.forEach((room) => {
		removeRoomElement(room);
	});
	addedRooms.forEach((room) => {
		addRoomElement(room);
	});
}

function getGameRoom(roomName = gameRoomName, listOfRooms = roomsList) {
	return listOfRooms.find((room) => room.name == roomName);
}

function removeTeamElement(name, team = "both") {
	let teamContainer = teamAContainer;

	if (team == "b") {
		teamContainer = teamBContainer;
	} else if (team == "both") {
		deleteElm(teamBContainer);
	}
	deleteElm(teamContainer);
	function deleteElm(container) {
		let teamPlayerElms = container.querySelectorAll("div");
		for (let players in teamPlayerElms) {
			if (teamPlayerElms[players].id == name + "id") {
				let elm = container.querySelector("#" + teamPlayerElms[players].id);
				try {
					elm.remove();
				} catch (error) {
					console.log(error);
				}
			}
		}
	}
}
function addTeamElement(name, team) {
	let newPlayerElm = teamPlayerCopy.cloneNode(true);
	newPlayerElm.id = name + "id";
	let content = newPlayerElm.querySelector("p");
	content.innerText = name;

	if (team == "a") {
		teamAContainer.appendChild(newPlayerElm);
	} else {
		teamBContainer.appendChild(newPlayerElm);
	}
}

function removeRoomElement(name, roomsContainerElm = roomsContainer) {
	let roomsContainerList = roomsContainerElm.querySelectorAll("div");
	roomsContainerList.forEach((elm) => {
		if (elm.querySelector("p")?.innerText == name) {
			elm.remove();
		}
	});
}

function addRoomElement(
	name,
	roomsContainerElm = roomsContainer,
	roomCopyElm = roomCopy
) {
	var clone = roomCopyElm.cloneNode(true);
	clone.id = "super-unique-id";
	roomsContainerElm.appendChild(clone);
	let content = clone.querySelector("p");
	content.innerText = name;
	clone.id = name + "id";
	clone.classList.remove("hidden");
}

socket.on("player-left", (socketId) => {
	console.log("player left team");
	removeTeamElement(socketId);
});
socket.on("invalid room name", () => {
	alert("Invalid Room Name");
});

socket.on("updateRooms", (backEndRooms, updatingTeams) => {
	updateRooms(backEndRooms, roomsList, updatingTeams);
	roomsList = backEndRooms;
	updatePlayerCounters();
	console.info(roomsList);
});

socket.on("joinedRoom", (roomName) => {
	rooms.style.display = "none";
	gameRoomMenu.style.display = "block";
	gameRoomMenu.querySelector("#gameRoomMenu .title h3").innerText = roomName;
	//some stuff for filling out room data
	gameRoomName = roomName;
});
socket.on("leftRoom", (roomName) => {
	rooms.style.display = "block";
	gameRoomMenu.style.display = "none";
	gameRoomMenu.querySelector("#gameRoomMenu .title h3").innerText = "";
	gameRoomRoom = "";
});

socket.on("connect", () => {
	document.querySelector("#socket-id-container").innerText = socket.id;
});

function updatePlayerCounters() {
	function findElm(name) {
		let divs = document.querySelectorAll(".rooms-container  .room");
		for (let i = 0; i < divs.length; i++) {
			if (divs[i].id == name + "id") {
				return divs[i].querySelector(".room-size");
			}
		}
		return undefined;
	}

	for (let room in roomsList) {
		if (findElm(room) != undefined)
			findElm(room).dataset.filled = roomsList[room].usersWaiting.length;
		else {
			console.log(findElm(room));
		}
	}
	//loop through roomslist and find elm with roomName and for loop to add filled class to x amount of its circles
}
function addRoom(name) {
	// socket.emit("rooms", name, "add");
	socket.emit("addRoomRequest", name);
	roomNameModal.close();
}

let roomNameModal = document.querySelector("#roomModal");
function openRoomModal() {
	roomNameModal.showModal();
}
function leaveTeam() {
	//find team and tell server you are leaving it
}
function joinTeam(team) {
	console.log("trying to join team: " + team);
	socket.emit("joinTeamRequest", gameRoomName, team);
}
function joinRoom(name) {
	socket.emit("joinRoomRequest", name);
}
function leaveRoom(name) {
	socket.emit("leaveRoomRequest", name);
}
function closeRoomModal() {
	roomNameModal.close();
}
