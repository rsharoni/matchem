// ===================================================
// written by roy sharoni
// 2019
// ===================================================

'use strict';

let gameConfig = {
    name: 'home',
    level: 'easy',
    levelLayout: {
        'easy': { row: 2, col: 4, cardWidth: 150, cardHeight: 200 },
        'medium': { row: 4, col: 4, cardWidth: 110, cardHeight: 150 },
        'hard': { row: 4, col: 8, cardWidth: 110, cardHeight: 150 },
    },
    cardGap: { h: 10, v: 10 },
    scatter: false,
    mix: false,
    infinite: false
};

let gameObjects = {
    'avengers': ['thor', 'captain-america', 'iron-man', 'hulk',
        'black-widow', 'hawk-eye', 'loki', 'fury',
        'winter-soldier', 'black-panther', 'thanos', 'ultron',
        'scarlet-witch', 'captain-marvel', 'gamora', 'doctor-strange',
    ],
    'star wars': ['vader', 'yoda', 'luke', 'solo',
        'obiwan', 'leia', 'chewbacca', 'palpatine',
        'jabba', 'r2d2', 'jarjar', 'lando',
        'bobbafett', 'ackbar', 'c3po', 'trooper',
    ],
    'jurassic park': ['dina1', 'dina2', 'dina3', 'dina4',
        'claire', 'dennis', 'donald', 'ellie',
        'henry', 'ian', 'john', 'lex',
        'neill', 'owen', 'ray', 'robert',
    ],
}

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let mixInterval;
let infiniteTimeout;
let gameOver = false;
let menuOpen = false;
let homeIntroTimeline;

let cards;
let matchedCards = [];

const body = document.querySelector("body");
const navMenu = document.querySelector("nav");
const hud = document.querySelector("div.hud");
const hudLogo = document.querySelector("div.hud > h1");
const hudGameName = document.querySelector("div.hud > .game-name");
const openNavArrow = document.querySelector("div.hud > .openNavArrow");
const home = document.querySelector(".home");
const gameContainer = document.querySelector("section.memory-game");
const bgImg = document.querySelector("#bg-img");

let chooseGameBtns = document.querySelectorAll('.home .choose-game-card');
let navNameBtns = document.querySelectorAll('nav input[name=name]');
let navLevelBtns = document.querySelectorAll('nav input[name=level]');
let advancedBtns = document.querySelectorAll('nav .advancedBtn');

let endModal = document.querySelector('.end-modal');
let exitModalBtn = document.querySelector('.exit-modal-btn');
let playAgainBtn = document.querySelector('.play-btn');
let endModalstars = document.querySelector('.trophy-container .stars');
let endModalTrophy = document.querySelector('.trophy-container .trophy');
let endModalScatter = document.querySelector('.trophy-container .scatter');
let endModalMix = document.querySelector('.trophy-container .mix');
let endModalInfinite = document.querySelector('.trophy-container .infinite');
let endModaltrophyLayers = document.querySelector('.trophy-container .trophyLayers');


const init = () => {
    // =====================================
    // home page
    // =====================================
    // home screen - choose game btns
    chooseGameBtns.forEach(btn => {
        setCssPointerEvents(btn, 'none');
        btn.addEventListener('click', () => {
            chooseGameBtns.forEach(btn => {
                setCssPointerEvents(btn, 'none');
            });

            homeIntroTimeline.reverse('sideNav').timeScale(1.5).eventCallback("onReverseComplete", () => {
                chooseGame(btn.dataset.card)
                setCssPointerEvents(btn, 'none');
            });

        });
    });

    animHomeIntro();

    // =====================================
    // hud
    // =====================================
    hudLogo.addEventListener('click', () => {

        homeIntroTimeline.timeScale(1);
        hideNavMenu();

        // put pointer events on the home choose game buttons
        chooseGameBtns.forEach(btn => {
            chooseGameBtns.forEach(btn => {
                btn.style.pointerEvents = 'auto';
            });
        });

        if (gameConfig.name === 'home') return;
        gameConfig.name = 'home';
        loadPage();
    });


    // =====================================
    // side nav
    // =====================================
    // games names
    navNameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chooseGame(btn.value);
        });

    });

    // game levels
    navLevelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chooseLevel(btn.value);
        });
    });

    // game advanced options
    advancedBtns.forEach(btn => {
        btn.addEventListener('click', () => chooseAdvancedOptions(btn.id, btn.checked));
    });

    document.addEventListener('mousemove', (e) => {
        if (gameConfig.name === 'home') return;
        if (e.x < 30) {
            if (menuOpen) return;
            openNavMenu();
        }
    });

    navMenu.addEventListener('mouseleave', (e) => {
        hideNavMenu();
        showArrow();
    });


    // =====================================
    // end modal
    // ======================================
    exitModalBtn.addEventListener('click', () => {
        endModalInAnimation.reverse();
    });
    playAgainBtn.addEventListener('click', () => {
        endModalInAnimation.reverse();
        gameInit();
    });

    TweenMax.set(endModal, { autoAlpha: 0, scale: 0.5 });

    loadPage();
}



window.onload = init;


// =====================================
// game functions
// =====================================

// game init start
const gameInit = () => {
    hudGameName.textContent = gameConfig.name;
    gameContainer.innerHTML = '';
    clearInterval(mixInterval);
    clearTimeout(infiniteTimeout);
    matchedCards = [];
    lockBoard = false;
    gameOver = false;

    buildCardLayout(gameConfig.name, gameConfig.levelLayout[gameConfig.level]);

    cards = document.querySelectorAll('div.memory-card');
    cards.forEach(card => {
        card.addEventListener('mouseup', flipCard);
        card.addEventListener('mousedown', function () { animDown(this) });
        card.addEventListener('mouseleave', function () { animUp(this) });
        card.addEventListener('mouseenter', function () { animeOver(this) });
    });

    cardsRandomEnter(cards);

    if (gameConfig.mix) {
        mixInterval = setInterval(function () { switch2Cards(cards) }, 3500);
    }

    loadPage();
}


function flipCard() {
    if (lockBoard || this.isCardFlipped) return;
    if (this === firstCard) return;

    setElementToHighestZIndex(this);

    this.setAttribute('data-isFlipped', 'true');
    animFlipIn(this);

    if (!hasFlippedCard) {
        //first click
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // second click
    hasFlippedCard = false;
    secondCard = this;
    checkForMatch();
    checkGameOver();
}

function checkForMatch() {
    // do card match?
    let isMatch = firstCard.dataset.card === secondCard.dataset.card;
    isMatch ? disableCards() : unflipCards();
}

function isCardOpen(card) {
    // do card open?
    return (firstCard === card || secondCard === card);
}


function disableCards() {
    lockBoard = false;
    setCssPointerEvents(firstCard, 'none');
    setCssPointerEvents(secondCard, 'none');
    matchedCards.push(firstCard);
    matchedCards.push(secondCard);

    // if gameconfig is scatter
    // put the matched cards at the bottom of screen
    if (gameConfig.scatter) {
        setElementToHighestZIndex(firstCard);
        setElementToHighestZIndex(secondCard);
        TweenMax.to([firstCard, secondCard], 0.5, {
            delay: 1.5,
            rotation: 0,
            top: document.body.clientHeight - (gameConfig.levelLayout[gameConfig.level].cardHeight / 2.5),
            left: getFirstCardPoint(gameConfig.levelLayout[gameConfig.level]).x + matchedCards.length / 2 * (firstCard.clientWidth / 2),
            ease: Back.easeOut.config(1.7),
        });
    }

    // if gameconfig is infinite
    if (gameConfig.infinite) {
        infiniteTimeout = setTimeout(function () { return2CardsToGame(matchedCards) }, (matchedCards.length * 4000 + (getNumOfCards() * 100)));
    }
}

function unflipCards() {
    lockBoard = true;
    firstCard.setAttribute('data-isFlipped', 'false');
    secondCard.setAttribute('data-isFlipped', 'false');
    TweenMax.to([firstCard, secondCard], 0.4, {
        delay: 1,
        rotationY: 0,
        ease: Elastic.easeOut.config(0.8, 0.6),
        onComplete: () => {
            resetBoard();
        }
    });
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

const buildCardLayout = (name, level) => {
    let rows = level.row;
    let cols = level.col;

    let cards = gameObjects[name];

    // shuffle the cards array
    let shuffleCards = shuffle(cards);

    // get the number of cards for level - 8, 16 , 32
    // divide by 2 for duplicate cards to pairs
    let uniqueCardsLevel = (rows * cols) / 2;

    // put 2 duplicates in one array
    shuffleCards = [...shuffleCards.slice(0, uniqueCardsLevel), ...shuffleCards.slice(0, uniqueCardsLevel)];
    shuffleCards = shuffle(shuffleCards);

    let firstCardPos = getFirstCardPoint(level);
    let hGap = gameConfig.cardGap.h;
    let vGap = gameConfig.cardGap.v;

    // render to dom
    let html = '';
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            let currImgName = shuffleCards[j];
            let fixedUrl = fixUrl(name);
            let leftPos = firstCardPos.x + j * (level.cardWidth + hGap);
            let topPos = firstCardPos.y + i * (level.cardHeight + vGap);
            html += `<div class="memory-card" data-card="${currImgName}" data-isFlipped="false" style="left:${leftPos}px; top:${topPos}px; width:${level.cardWidth}px; height:${level.cardHeight}px; z-index:'0'">
                         <img src="img/${fixedUrl}/${currImgName}.jpg" alt="${currImgName}" class="front-face" draggable="false"/>
                         <img src="img/${fixedUrl}/logo.jpg" alt="${fixedUrl} logo" class="back-face" draggable="false"/>
                    </div>`;

        }

        // cut from shuffleCards array
        shuffleCards.splice(0, cols);
    }

    gameContainer.innerHTML = html;
}


function cardsRandomEnter(cards) {
    // animation for scatter enter
    if (gameConfig.scatter) {
        // random position
        TweenMax.staggerFromTo(cards, 1,
            {
                autoAlpha: 0,
                left: getMiddleViewPoint().x,
                top: getMiddleViewPoint().y,
                scale: 0.3,
                zIndex: 0,
                cycle: {
                    rotation: function () {
                        return Math.random() * 90;
                    },
                },
                ease: Back.easeOut.config(1.8),
            },
            {
                autoAlpha: 1,
                scale: 1,
                cycle: {
                    left: () => getRandomIntInclusive(100, document.body.clientWidth - 150),
                    top: () => getRandomIntInclusive(100, document.body.clientHeight - 150),
                    rotation: () => Math.random() * 90,
                },
                ease: Back.easeOut.config(1.7)
            },

            0.07);

        return;
    }

    // random enter animation for the regular mode
    if (Math.random() > 0.5) {
        TweenMax.staggerFrom(cards, 1, {
            autoAlpha: 0,
            left: getMiddleViewPoint().x,
            top: getMiddleViewPoint().y,
            scale: 0.3,
            zIndex: -100,
            cycle: {
                rotation: function () {
                    return Math.random() * 90;
                },
            },
            ease: Back.easeOut.config(1.8),
        }, 0.09);
    } else {
        TweenMax.staggerFrom(cards, 1, {
            autoAlpha: 0,
            left: getMiddleViewPoint().x,
            top: window.innerHeight + 200,
            scale: 0.3,
            zIndex: -100,
            ease: Back.easeOut.config(1.7)
        }, 0.07);
    }
}

// when the gameCongig.mix === true
// switch 2 card location with each other from the array
function switch2Cards(gameCards) {
    let filteredCards = [...gameCards].filter(card => isCardFlipped(card) === false);

    if (filteredCards.length <= 2) {
        clearInterval(mixInterval);
        return;
    }

    let cardsToReplace = [];

    // add first card
    let randomNum = getRandomIntInclusive(0, filteredCards.length - 1);
    let card = filteredCards[randomNum];
    cardsToReplace.push(card);

    // remove the first card from filteredCards array
    filteredCards.splice(randomNum, 1);

    // add second card
    randomNum = getRandomIntInclusive(0, filteredCards.length - 1);
    card = filteredCards[randomNum];
    cardsToReplace.push(card);

    setElementToHighestZIndex(cardsToReplace[0]);
    setElementToHighestZIndex(cardsToReplace[1]);

    TweenMax.to(cardsToReplace[0], 1.2,
        {
            top: cardsToReplace[1].offsetTop,
            left: cardsToReplace[1].offsetLeft,
            ease: Elastic.easeOut.config(1, 0.75)
        }
    );

    TweenMax.to(cardsToReplace[1], 1.2,
        {
            top: cardsToReplace[0].offsetTop,
            left: cardsToReplace[0].offsetLeft,
            ease: Elastic.easeOut.config(1, 0.75)
        }
    );

    // return correct cards at the bottom of the screen to top z-index
    if (gameConfig.scatter) {
        [...gameCards].filter(card => isCardFlipped(card))
            .map(card => setElementToHighestZIndex(card));
    }
}


// when the gameCongig.infinite === true
// return 2 matched card back to game
function return2CardsToGame(matchedCards) {
    if (matchedCards.length === 0 || gameOver) {
        return;
    }

    let returnCards = matchedCards.splice(0, 2);
    for (let i = 0; i < returnCards.length; i++) {
        returnCards[i].setAttribute('data-isFlipped', 'false');
        setCssPointerEvents(returnCards[i], 'auto');
    }

    // in regular mode flip back card 
    if (!gameConfig.scatter) {
        // flip back the 2 cards
        TweenMax.to(returnCards, 0.5, {
            rotationY: 0,
            ease: Elastic.easeOut.config(1, 0.6),
        });
    }


    //in scatter mode return the card in rendom position
    if (gameConfig.scatter) {
        TweenMax.staggerTo(returnCards, 1, {
            rotationY: 0,
            cycle: {
                left: () => getRandomIntInclusive(100, document.body.clientWidth - 150),
                top: () => getRandomIntInclusive(100, document.body.clientHeight - 150),
                rotation: () => Math.random() * 90,
            },
            ease: Back.easeOut.config(1.7)
        },
            0.07);
    }
}


function checkGameOver() {
    if (matchedCards.length === gameConfig.levelLayout[gameConfig.level].row * gameConfig.levelLayout[gameConfig.level].col) {
        gameOver = true;
        lockBoard = true;

        //set the end modal graphics
        endModalstars.src = `./img/ui/${gameConfig.level}.png`;

        endModalScatter.style.opacity = 0;
        endModalMix.style.opacity = 0;
        endModalInfinite.style.opacity = 0;
        endModalTrophy.style.opacity = 0;
        endModaltrophyLayers.style.display = 'none';

        let showTrophy = false;
        if (gameConfig.scatter) {
            showTrophy = true;
            endModalScatter.style.opacity = 1;
        };
        if (gameConfig.mix) {
            showTrophy = true;
            endModalMix.style.opacity = 1;
        };
        if (gameConfig.infinite) {
            showTrophy = true;
            endModalInfinite.style.opacity = 1;
        };

        if (showTrophy) {
            endModaltrophyLayers.style.display = 'flex';
            endModalTrophy.style.opacity = 1;
        }

        endModalInAnimation.play().delay(1);
    }
}

function getNumOfCards() {
    return gameConfig.levelLayout[gameConfig.level].row * gameConfig.levelLayout[gameConfig.level].col;
}


function loadBgImg(gameName) {
    TweenMax.to(bgImg, 0.3, {
        opacity: 0,
        scale: 1,
        onComplete: () => {
            let img = new Image();
            img.onload = function () {
                bgImg.style.backgroundImage = `url(${img.src})`;
                img = null;
                TweenMax.to(bgImg, 0.8,
                    {
                        opacity: 1,
                        scale: 1.2
                    },
                )
            };

            img.src = `./img/${fixUrl(gameName)}/bg.jpg`;
        }
    })
}


function fadInPage(page) {
    TweenMax.to(`${page}`, 0.3, {
        autoAlpha: 1,
    })
}
function fadOutPage(page) {
    TweenMax.to(`${page}`, 0.3, {
        autoAlpha: 0,
    })
}

function loadPage() {
    if (gameConfig.name === 'home') {
        fadInPage('.home');
        homeIntroTimeline.restart();
        fadOutPage('.memory-game');
        setCssPointerEvents(hudLogo, 'none');
        hudFadeOut();
    } else {
        fadOutPage('.home');
        fadInPage('.memory-game');
        setCssPointerEvents(hudLogo, 'auto');
        setCssPointerEvents(hud, 'none');
        hudFadeIn();

    }

    endModalInAnimation.reverse();
    loadBgImg(gameConfig.name);
    updateSideNav();
}

// show nav 
function openNavMenu() {
    menuOpen = true;
    hudFadeIn();
    TweenMax.to(navMenu, 0.3,
        {
            left: '0%',
            ease: Power4.easeOut,
            force3D: false,
        }
    );

    // hide arrow
    hideArrow();

}
// hide nav
function hideNavMenu() {
    if (gameConfig.name === 'home') hudFadeOut();
    TweenMax.to(navMenu, 0.2,
        {
            left: '-=100%',
            ease: Power4.easeIn,
            force3D: false,
            onComplete: () => { menuOpen = false }
        }
    );
}




// =====================================
// ui functions
// =====================================
function chooseGame(name) {
    gameConfig.name = name;
    gameInit();
}
function chooseLevel(level) {
    gameConfig.level = level;
    gameInit();
}
function chooseAdvancedOptions(key, val) {
    gameConfig[key] = val;
    gameInit();
}

function updateSideNav() {
    navNameBtns.forEach(btn => {
        if (gameConfig.name === btn.value) {
            // btn is chosen
            setCssPointerEvents(btn.nextElementSibling, 'none');
            btn.checked = true;
        } else {
            // btn is not chosen
            setCssPointerEvents(btn.nextElementSibling, 'auto');
            btn.checked = false;
        }
    });

    // game levels
    navLevelBtns.forEach(btn => {
        if (gameConfig.level === btn.value) {
            // btn is chosen
            setCssPointerEvents(btn.nextElementSibling, 'none');
            btn.checked = true;
        } else {
            // btn is not chosen
            setCssPointerEvents(btn.nextElementSibling, 'auto');
            btn.checked = false;
        }
    });
}





// =====================================
// animations functions
// =====================================

const animDown = (card) => {
    if (lockBoard || isCardFlipped(card)) return;
    TweenMax.to(card, 0.1, {
        scale: 0.96,
        ease: Back.easeOut.config(0.3)
    });
}
const animUp = (card) => {
    if (lockBoard || isCardFlipped(card)) return;
    TweenMax.to(card, 0.2, {
        scale: 1,
        ease: Back.easeOut.config(0.3)
    });
}
const animeOver = (card) => {
    if (lockBoard || isCardFlipped(card)) return;
    if (isCardOpen(card)) return;
    TweenMax.to(card, 0.3, {
        scale: 1.05,
        ease: Back.easeOut.config(0.3)
    });
}

const animFlipIn = (card) => {
    TweenMax.to(card, 1.4, {
        scale: 1,
        rotationY: 180,
        ease: Elastic.easeOut.config(1, 0.6)
    });
}

const animHomeIntro = () => {
    homeIntroTimeline = new TimelineMax({
        paused: true,
        onStart: function () {
            chooseGameBtns.forEach(btn => {
                setCssPointerEvents(btn, 'none');
            });
        },
        onComplete: function () {
            chooseGameBtns.forEach(btn => {
                setCssPointerEvents(btn, 'auto');
            });
        }
    });

    homeIntroTimeline
        .from(".home > .logo", 1, {
            scale: 0,
            autoAlpha: 0,
        })
        .from(".home > h2", 0.5, {
            scale: 0.7,
            autoAlpha: 0,
        }, "-=0.3")
        .from(".home > h3", 0.5, {
            autoAlpha: 0,
        }, "-=0.2")
        .from(".home .choose-game-card-container", 0.5, {
            scale: 0.9,
            autoAlpha: 0,
        }, "-=0.3")
        .addLabel('sideNav')
        .addPause('sideNav')
}

// end modal animation
let endModalInAnimation = TweenMax.to(endModal, 0.4, {
    autoAlpha: 1,
    scale: 1,
    ease: Power3.easeIn
}).pause();


// show hud 
function hudFadeIn(delay = 0) {
    if (hud.style.opacity === '1') return;
    TweenMax.fromTo(hud, 1,
        {
            scale: 0.9,
            autoAlpha: 0,
        },
        {
            scale: 1,
            autoAlpha: 1,
            ease: Back.easeOut,
        }
    ).delay(delay);

    showArrow();
}

// hide hud 
function hudFadeOut(delay = 0) {
    TweenMax.to(hud, 1,
        {
            autoAlpha: 0,
        }
    ).delay(delay);
}

function showArrow() {
    // show arrow
    if (openNavArrow.style.opacity === '1') return;
    TweenMax.to(openNavArrow, 0.3,
        {
            autoAlpha: 1,
            ease: Power4.easeOut,
        }
    );
}
function hideArrow() {
    // hide arrow
    TweenMax.to(openNavArrow, 0.3,
        {
            autoAlpha: 0,
            ease: Power4.easeOut,
        }
    );
}




// =====================================
// utils functions
// =====================================
function fixUrl(url) {
    return url.replace(/ /g, "_");
}
function getMiddleViewPoint() {
    return {
        x: document.body.clientWidth / 2,
        y: document.body.clientHeight / 2
    }
}
function getFirstCardPoint(level) {
    let cardWidth = level.cardWidth;
    let cardHeight = level.cardHeight;
    let hGap = gameConfig.cardGap.h;
    let vGap = gameConfig.cardGap.v;

    let cardsTotalWidth = (cardWidth + vGap) * level.col - vGap;
    let cardsTotalHeight = (cardHeight + hGap) * level.row - hGap;

    return {
        x: getMiddleViewPoint().x - (cardsTotalWidth / 2),
        y: getMiddleViewPoint().y - (cardsTotalHeight / 2)
    }
}
function setElementToHighestZIndex(el) {
    el.style.zIndex = `${+findHighestZIndex(cards) + 1}`;
}

function findHighestZIndex(items) {
    var highest = 0;
    for (var i = 0; i < items.length; i++) {
        var zindex = +items[i].style.zIndex;
        if ((zindex >= highest) && (zindex != 'auto')) {
            highest = zindex;
        }
    }
    return highest;
}

function isCardFlipped(card) {
    let isFlipped = card.getAttribute("data-isFlipped");
    return JSON.parse(isFlipped);
}

function addEventListenerToElement(evType, cb, element) {
    element.addEventListener(`${evType}`, cb);
    element.style.pointerEvents = 'auto';
}
function setCssPointerEvents(element, val) {
    element.style.pointerEvents = `${val}`;
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
