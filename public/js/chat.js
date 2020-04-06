const socket = io();

//Elements
const $messageForm = document.querySelector("#myForm");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll =  ()=>{
  // New Message Element
  const $newMessage = $messages.lastElementChild;

  //Height of the New Message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + 2*newMessageMargin;

  //visibleHeight
  const visibleHeight = $messages.offsetHeight;

  //Height of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have I scroll Down?
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("LT"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (url) => {
  console.log(url);
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("LT"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", $messageFormInput.value, (message) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    console.log("The message was ", message);
  });
  e.target.elements.message.value = "";
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("GPS not supported by your browser!");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (ack) => {
        $sendLocationButton.removeAttribute("disabled");
        console.log(ack);
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
