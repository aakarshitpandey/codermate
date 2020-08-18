const setBackground = (res) => {
    // toDataURL(res.urls.raw, (data) => {
    //     document.body.style.backgroundImage = `url(${data})`
    // })
    let img = new Image();
    img.onload = () => {
        console.log('loaded')
        document.body.style.background = `url(${img.src})`
    }
    img.src = `${res.urls.raw}?auto=format`
}

const setAuthorName = (res) => {
    if (res) {
        document.getElementById('author-name').innerHTML = `<a target="_blank" href="${res.user.links.html}">${res.user.username}</a>`
    }
}

const updateLocalStorage = (res, key) => {
    // toDataURL(res.urls.raw, (data) => {
    //     if (key) {
    //         try {
    //             // localStorage.setItem(key, data)
    //             setChromeLocalStorage(key, data)
    //         } catch (e) {
    //             // localStorage.clear()
    //             clearChromeStorage()
    //         }
    //     }
    // })
    if (key) {
        try {
            // localStorage.setItem(key, data)
            setChromeLocalStorage(key, res)
        } catch (e) {
            // localStorage.clear()
            clearChromeStorage()
        }
    }
}

const getFromLocalStorage = (key, callback) => {
    console.log('getting ', key)
    chrome.storage.local.get([key], function (data) {
        console.log('got', key, data)
        callback(data.key)
    })
}

const setChromeLocalStorage = (key, data) => {
    let setting = {}
    setting[key] = data
    console.log('Setting', setting)
    chrome.storage.local.set(setting)
}

const clearChromeStorage = () => {
    chrome.storage.local.clear(function () {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    })
}

const updateAuthorName = (res, key) => {
    // localStorage.clear()
    // clearChromeStorage()
    if (key) {
        try {
            // localStorage.setItem(key, `<a target="_blank" href="${res.user.links.html}">${res.user.username}</a>`)
            setChromeLocalStorage(key, `<a target="_blank" href="${res.user.links.html}">${res.user.username}</a>`)
        } catch (e) {
            // localStorage.clear()
            clearChromeStorage()
        }
    }
}

const toDataURL = (url, callback) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onload = function () {
        var fr = new FileReader();
        fr.onload = function () {
            callback(this.result);
        };
        fr.readAsDataURL(xhr.response);
    };
    xhr.send();
}

const getCreds = (callback) => {
    console.log('getting creds')
    const path = 'creds.json'
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
        if (this.status == 200) {
            var file = new File([this.response], 'temp');
            var fr = new FileReader();
            fr.onload = () => {
                callback(JSON.parse(`${fr.result}`))
            };
            fr.readAsText(file);
        }
    }
    xhr.send();
}

const assignAuthorNameFromLocalStorage = () => {
    // const authorName = localStorage.getItem('authorName')
    // if (authorName) {
    //     document.getElementById('author-name').innerHTML = authorName
    // }
    getFromLocalStorage('authorName', (authorName) => {
        console.log(authorName)
        if (authorName) {
            document.getElementById('author-name').innerHTML = authorName
        }
    })
}

const checkMissingImages = (callback) => {
    let date = new Date()
    let missing = []
    // for (let i = 0; i < 1; i++) {
    let key = getKey(date)
    // if (!localStorage.getItem(key)) {
    //     missing.push(key)
    // }
    console.log('Checking local')
    getFromLocalStorage(key, (item) => {
        console.log(item)
        if (!item) {
            missing.push(key)
        }
        callback(missing)
    })
    // date = date.addDays(1)
    // }
    // return missing
}

const getBackground = (creds) => {
    assignAuthorNameFromLocalStorage()
    checkMissingImages((missingImages) => {
        console.log('missing images: ', missingImages)
        if (missingImages.indexOf(getKey(new Date())) < 0) {
            // let dataUrl = localStorage.getItem(getKey(new Date()))
            // document.body.style.backgroundImage = `url(${dataUrl})`
            // getFromLocalStorage(getKey(new Date()), (dataUrl) => {
            //     document.body.style.backgroundImage = `url(${dataUrl})`
            // })
            getFromLocalStorage(getKey(new Date()), setBackground)
        }

        if (missingImages.length > 0) {
            let url = `https://api.unsplash.com/photos/random?query=morning+landscape+programming&orientation=landscape&count=${missingImages.length}`
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", url, true)
            xmlHttp.setRequestHeader("Authorization", `Client-ID ${creds.unsplashAccessKey}`)
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                    let res = JSON.parse(xmlHttp.responseText)
                    for (let i = 0; i < res.length; i++) {
                        if (missingImages[i] === getKey(new Date())) {
                            setAuthorName(res[i])
                            setBackground(res[i])
                        }
                        updateAuthorName(res[i], 'authorName')
                        updateLocalStorage(res[i], missingImages[i])
                    }
                }
            }
            xmlHttp.send(null)
        }
    })
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const getKey = (date) => {
    return `Image:${date.toDateString()}`
}

getCreds(getBackground)

//set the time programmatically
setInterval(() => {
    const date = new Date()
    document.getElementById('time').innerHTML = `this.setState({time: ${date.toLocaleTimeString()}})`
}, 1000)

//get dev news
const getDevBlogs = () => {
    let url = 'https://dev.to/api/articles?per_page=10'
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, true)
    const devNews = document.getElementById('dev-news')
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            let res = JSON.parse(xmlHttp.responseText)
            res.map((news) => {
                const div = document.createElement('div')
                div.classList.add('card')
                div.classList.add('news')
                div.innerHTML = `<img src="${news.social_image}" style="background:white" class="card-img-top" alt="...">
                                 <div class="card-body">
                                    <h5 class="card-title">${news.title}</h5>
                                    <a href="${news.canonical_url}" target="_blank" class="btn btn-primary">Read More</a>
                                 </div>`
                devNews.appendChild(div)
            })
        }
    }
    xmlHttp.send(null)
}

getDevBlogs()

//redirect to a google search
document.getElementById('g-search').addEventListener('keydown', (e) => {
    const code = e.keyCode
    if (code === 13) {
        let text = document.getElementById('g-search').value.toString()
        text = text.replace(' ', '+')
        window.location = 'https://google.com/search?q=' + text
    }
})

//Fetch Top Questions
const getTopQuestions = () => {
    let url = 'https://us-central1-chatbot-8510b.cloudfunctions.net/scraper'
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, true)
    const devNews = document.getElementById('top-questions')
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            let res = JSON.parse(xmlHttp.responseText)
            res.map((question) => {
                const div = document.createElement('div')
                div.innerHTML = `<div class="card question" style="width: 25rem;">
                                    <div class="card-body">
                                        <h5 class="card-title">${question.question}</h5>
                                        <a href="${question.href}" target="_blank" class="btn btn-primary">Read More</a>
                                    </div>
                                </div>`
                devNews.appendChild(div)
            })
        }
    }
    xmlHttp.send(null)
}

getTopQuestions()

//CHAT BOT
const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

// Icons made by Freepik from www.flaticon.com
const BOT_IMG = "https://image.flaticon.com/icons/svg/327/327779.svg";
const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const BOT_NAME = "BOT";
const PERSON_NAME = "Me";

msgerForm.addEventListener("submit", event => {
    event.preventDefault();

    const msgText = msgerInput.value;
    if (!msgText) return;

    appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
    msgerInput.value = "";

    botResponse(msgText);
});

function appendMessage(name, img, side, text) {
    //   Simple solution for small apps
    const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

    msgerChat.insertAdjacentHTML("beforeend", msgHTML);
    msgerChat.scrollTop += 500;
}

function botResponse(message) {
    const xhtml = new XMLHttpRequest()
    xhtml.open('GET', 'https://us-central1-chatbot-8510b.cloudfunctions.net/dialogFlowGateway?text=' + message, true)
    xhtml.onreadystatechange = () => {
        if (xhtml.readyState === 4 && xhtml.status === 200) {
            const res = JSON.parse(xhtml.responseText)
            // console.log(res)
            // console.log(res.fulfillmentMessages[0].text.text[0])
            const text = `${res.fulfillmentMessages[0].text.text[0]}`
            if (text.startsWith('/redirect:')) {
                appendMessage(BOT_NAME, BOT_IMG, "left", "Sure thing!")
                setTimeout(() => {
                    window.location = text.substring(text.indexOf(':') + 1)
                }, 200)
            } else {
                appendMessage(BOT_NAME, BOT_IMG, "left", res.fulfillmentMessages[0].text.text[0])
            }
        }
    }
    xhtml.send()
}

// Utils
function get(selector, root = document) {
    return root.querySelector(selector);
}

function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

document.querySelector('#init-time').innerHTML = `${formatDate(new Date())}`