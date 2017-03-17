﻿var canvas = document.getElementById('main_canvas'),
    ctx = canvas.getContext('2d'),
    background = new Image();
background.src = './images/background.main.jpg';
var lastTime; //calculate Fps
var timer = 0;
var pause = false;
var innerMapData={ maps: [[[20, 20, 2, 1, 1], [60, 40, 1, 2, 1]], [[20, 20, 1, 1, 1], [20, 40, 2, 1, 1], [60, 40, 3, 2, 1], [60, 20, 3, 3, 1], [30, 10, 1, 0, 1]]], date: "2017.1.24", author: "w12101111" };
var colony = {
    data: [],
    map: [], //0:x,1:y,2:size,3:camp,4:type,5:population array,6:orbit data array,7:capture() cent.8:atWar?
    ship: [], //0:x,1:y,2:population,3:camp,4:source,5:target
    config: {
        maxPopulation: 20,
        initPopulation: 10,
        maxCamp: 6, //match colonyUI.color.length
        growthSpeed: 0.0005,
        shipSpeed: 0.002,
        combatSpeed: 0.001,
        captureSpeed: 0.004,
        aiThinkSpeed: 500
    },
    camp: 1,
    shipRatio: 1,
    lastSelect: undefined,
    loadMap: function (n) {
        lastTime = Date.now();
        colony.map = colony.data.maps[n - 1];
        colony.map.forEach(function (star) {
            star[5] = new Array(colony.config.maxCamp);
            if (star[3] !== 0) {
                star[5][star[3]] = star[2] * colony.config.initPopulation; //initialize population 
            }
        });
        colonyUI.controlUI();
        window.requestAnimationFrame(animation);
        colony.ai();
    },
    shipMove: function (from, to, camp, cent) { //cent
        if (from === to) return;
        if (!colony.map[from][5][camp]) return;
        if (!colony.map[to][5][camp]) colony.map[to][5][camp] = 0;
        let movePopulation = parseInt((colony.map[from][5][camp] * cent).toFixed());
        colony.map[from][5][camp] = parseInt(((1 - cent) * colony.map[from][5][camp]).toFixed());
        var ship = [];
        ship[0] = colony.map[from][0];
        ship[1] = colony.map[from][1];
        ship[2] = movePopulation;
        ship[3] = camp;
        ship[4] = from;
        ship[5] = to;
        colony.ship.push(ship);
    },
    shipOrbit: function (aship, index) {
        var distanceX = colony.map[aship[5]][0] - colony.map[aship[4]][0], //to-from
            distanceY = colony.map[aship[5]][1] - colony.map[aship[4]][1];
        var distance = colonyUI.distance(colony.map[aship[5]][0], colony.map[aship[5]][1], colony.map[aship[4]][0], colony.map[aship[4]][1]);
        aship[0] += distanceX / distance * colony.config.shipSpeed * colonyUI.fps;
        aship[1] += distanceY / distance * colony.config.shipSpeed * colonyUI.fps;
        if ((aship[0] - colony.map[aship[5]][0]) * distanceX > 0 || (aship[1] - colony.map[aship[5]][1]) * distanceY > 0) {
            colony.map[aship[5]][5][aship[3]] += aship[2];
            delete colony.ship[index];
        }
    },
    starOrbit: function () {
        //wait
    },
    combat: function (star) {
        if (!star[8]) star[8] = true;
        for (let i = 0, len = star[5].length; i < len; i++) {
            if (!star[5][i]) continue;
            if (star[5][i] < 0) star[5][i] = undefined;
            star[5][i] -= colony.config.combatSpeed * colonyUI.fps;
        }
    },
    capture: function (star) {
        if (!star[7]) star[7] = 0;
        star[7] += colony.config.captureSpeed * colonyUI.fps;
        if (star[7] > 100) {
            for (let i = 0, len = star[5].length; i < len; i++) {
                if (star[5][i]) {
                    star[3] = i;
                    star[7] = undefined;
                    break;
                }
            }
        }
        return star[7];
    },
    grow: function (star) {
        if (star[5][star[3]] < star[2] * colony.config.maxPopulation) {
            star[5][star[3]] += colony.config.growthSpeed * colonyUI.fps;
        }
        if (star[5][star[3]] > star[2] * (colony.config.maxPopulation + colony.config.initPopulation)) {
            star[5][star[3]] -= colony.config.growthSpeed * colonyUI.fps;
        }
    },
    ai: function () {
        window.setInterval(function () {
            if (!pause) {
                for (let aiCamp = 1; aiCamp < colony.config.maxCamp; aiCamp++) {
                    if (aiCamp === colony.camp) continue;
                    var from = [], to = undefined, cent;
                    var len = colony.map.length, dis = 10000;
                    var population = 0, enemy_pop = new Array(5);
                    var no_people_star = [], cnt = 0, tmp = 0;
                    for (let i = 0; i < len; i++) {
                        let star = colony.map[i];
                        if (!star[7]) no_people_star[cnt++] = i;
            /*找出发点*/if (star[7] === aiCamp && star[5][aiCamp] > population) {
                            population = star[5][aiCamp];
                            from[tmp++] = i;
                        }
                        else if (star[7] === aiCamp && star[5][aiCamp] === population) from[tmp++] = i;
                    }
                    if (typeof no_people_star[0] !== "undefined") { }
                    /*for(let i=0;i<len;i++){
                        let star = colony.map[i];
                        if (!star[5][aiCamp] || star[5][aiCamp] < 5) continue;
                        if (!!star[7]) continue;
                        if (!!star[8]) {
                            from = i;
                            break;
                        }
                        if (!star[8] && star[5][aiCamp] > population) {
                            population = star[5][aiCamp];
                            from = i;
                        }
                    }
                    population = 1000;
                    if (typeof (from) === 'undefined') continue;
                    for (let i = 0; i < len; i++) {
                        let star = colony.map[i];
                        if ((star[3] === aiCamp) && (!!star[7] || !!star[8])) {
                            to = i;
                            let enemyMax = 0;
                            for (let j = 0; j < star[5].length; j++) {
                                if (!!star[5][j] && star[5][j] > enemyMax) enemyMax = star[5][j];
                            }
                            cent = enemyMax / colony.map[from][5][aiCamp];
                            if (cent < 0.9) cent += 0.1;
                            break;
                        }
                        if (star[3] === 0) {
                            to = i;
                            cent = colony.map[from][aiCamp] * 0.5 > 10 ? 0.5 : 10 / colony.map[from][5][aiCamp];
                            if (Math.random() > 0.5)
                                break;
                        }
                        if (!star[7] && !star[8] && star[5][star[3]] < population) {
                            population = star[5][star[3]];
                            to = i;
                            cent = population / colony.map[from][5][aiCamp];
                            if (cent < 0.9) cent += 0.1;
                            if (Math.random() > 0.5)
                                break;
                        }
                    }*/
                    if (typeof from !== 'undefined' && typeof to !== 'undefined' && cent > 0 && cent <= 1)
                        colony.shipMove(from, to, aiCamp, cent);
                }
            }
        }, colony.config.aiThinkSpeed);
    },
    winChick: function () {
        if (!colony.map[0]) return;
        if (pause) return;
        var win = true;
        var fail = true;
        for (let i = 0, len = colony.map.length; i < len; i++) {
            if (colony.map[i][3] !== colony.camp)
                win = false;
            else
                fail = false;
        }
        if (win) {
            pause = true;
            alert("Congratulation,you are winner!");
        }
        if (fail) {
            pause = true;
            alert("You are defeated!");
        }
    }
}, colonyUI = {
    config: {
        ZOOM_ON_X: 100,
        ZOOM_ON_Y: 50,
        zoom_x: 20,
        zoom_y: 20
    },
    fps: undefined,
    color: ["DimGray", "Orchid", "SpringGreen", "OrangeRed", "DodgerBlue", "Black"],
    drawBackground: function () {
        function imageLoad(callback) {
            if (background.complete) {
                callback.call(background);
                return;
            }
            background.onload = function () {
                callback.call(background);
            };
        }
        try {
            imageLoad(function(){
                ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
            });
        } catch (e) {
            console.log("background load fail!" + e);
        }
    },
    init: function () {
        colony.map = [];
        colony.ship = [];
        function title() {
            colonyUI.canvasResize();
            colonyUI.drawBackground();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "18pt Arial";
            ctx.fillStyle = "black";
            ctx.fillText("click to start", canvas.width / 2, canvas.height * 0.8);
        }
        title();
        window.addEventListener("resize",title);
        document.getElementById("main_canvas").onclick = function (e) {
            $("#main").hide();
            colony.data=innerMapData;
            colonyUI.main(0);
            this.onclick = undefined;
            window.removeEventListener("resize", title);
        };
        document.getElementById("openFile").addEventListener("click", function (e) {
            e.preventDefault();
            document.getElementById("file").onchange = function () {
                var selectedFile = this.files[0];
                var reader = new FileReader();
                reader.readAsText(selectedFile);
                reader.onload = function () {
                    colony.data = JSON.parse(this.result);
                    $("#main").hide();
                    colonyUI.main(0);
                    window.removeEventListener("resize", title);
                };
            };
            document.getElementById("file").click();
        });
    },
    main: function (status) {
        colonyUI.canvasResize();
        colonyUI.drawBackground();
        var len = colony.data.maps.length;
        var text = "<div id=\"choose\">";
        var mapN = 0;
        for (var i = 1; i <= len; i++) {
            text += "<button type=\"button\" class=\"choose_map\" id=\"map" + i + "\">" + i + "</button>";
        }
        text += "</div>";
        $("#pos").before(text);
        $("button.choose_map").click(function () {
            mapN = parseInt($(this).attr("id").substring(3)); //mapX
            $("button.choose_map").hide();
            $("#pos").show();
            colony.loadMap(mapN);
        });
    },
    controlUI: function () {
        canvas.addEventListener("touchstart", function (e) {
            colonyUI.select(e);
            e.preventDefault();
        });
        canvas.addEventListener("mousedown", function (e) {
            colonyUI.select(e);
            e.preventDefault();
        });
        window.addEventListener("resize", function () {
            colonyUI.canvasResize();
            colonyUI.updateFrame();
        });
        document.getElementById("pause").onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            pause = !pause;
            this.innerText = pause ? "Start" : "Pause";
        };
        document.getElementById("ship_control").onclick = function (e) {
            var shipControlInput = document.getElementById("ship_from_to").value; //from,to,camp
            let from = parseInt(shipControlInput),
                to = parseInt(shipControlInput.substring(from.toString().length + 1)),
                camp = parseInt(shipControlInput.substring(from.toString().length + to.toString().length + 2));
            colony.shipMove(from, to, camp, colony.shipRatio);
        };
        document.getElementById("shipRatio").onchange = function (e) {
            document.getElementById("shipRatioText").innerText = this.value + "%";
            colony.shipRatio = parseInt(this.value) / 100;
        };
        background.src = "./images/background.jpg";
    },
    updateFrame: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        colonyUI.drawBackground();
        colonyUI.fps = colonyUI.calculateFpsAndTime();
        colony.map.forEach(function (star, index) {
            colonyUI.drawStar(star, index);
            colonyUI.drawShipOnStar(star, index);
        });
        colony.ship.forEach(function (aship, index) {
            colony.shipOrbit(aship, index);
            colonyUI.drawShipOnWay(aship);
        });
        if (typeof colony.lastSelect !== 'undefined') {
            colonyUI.drawStarSelectTip();
        }
        colony.winChick();
        document.getElementById("input_fps").value = colonyUI.fps.toFixed() + ' fps';
    },
    drawStar: function (star, index) {
        var x = colonyUI.config.zoom_x * star[0],
            y = colonyUI.config.zoom_y * star[1];
        switch (star[4]) {
            case 1:
                ctx.lineWidth = 2;
                ctx.fillStyle = colonyUI.color[star[3]];
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.arc(x, y, 10 * star[2] + 10, 0, 2 * Math.PI, true);
                ctx.stroke();
                ctx.fill();
                break;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = '10pt Arial'; //test only
        ctx.fillStyle = "black"; //test only
        ctx.fillText("index:" + index, x, y); //test only
    },
    drawShipOnStar: function (star, index) {
        var x = colonyUI.config.zoom_x * star[0],
            y = colonyUI.config.zoom_y * star[1];
        var totalPopulation = 0,
            totalCamp = 0,
            atWar = false,
            capturing = false;
        for (let i = 0, len = star[5].length; i < len; i++) {
            if (!star[5][i]) continue;
            totalPopulation += star[5][i];
            totalCamp++;
        }
        if (totalCamp > 1) atWar = true;
        if (totalCamp === 1 && !star[5][star[3]]) capturing = true;
        for (let i = 0, len = star[5].length, populationCount = 0; i < len; i++) {
            text = star[5][i];
            if (!text) continue;
            ctx.fillStyle = colonyUI.color[i];
            ctx.strokeStyle = colonyUI.color[i];
            if (!populationCount && text) populationCount = totalPopulation / 4 - text / 2;
            if (atWar) {
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(x, y, 10 * star[2] + 35, populationCount / totalPopulation * 2 * Math.PI, (populationCount + text) / totalPopulation * 2 * Math.PI, false);
                ctx.stroke();
                ctx.lineWidth = 2;
                ctx.fillText(text.toFixed(), x + (10 * star[2] + 20) * Math.cos((populationCount + text / 2) / totalPopulation * Math.PI * 2), y + (10 * star[2] + 20) * Math.sin((populationCount + star[5][i] / 2) / totalPopulation * Math.PI * 2));
                colony.combat(star);
            } else {
                ctx.fillText(text.toFixed(), x, y + (10 * star[2] + 20));
                star[8] = undefined;
            }
            if (capturing) {
                var cent = colony.capture(star);
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(x, y, 10 * star[2] + 35, 0, cent / 100 * 2 * Math.PI, false);
                ctx.stroke();
            } else {
                star[7] = undefined;
            }
            if (!atWar && !capturing) {
                colony.grow(star);
            }
            populationCount += text;
        }
    },
    drawShipOnWay: function (ship) {
        var distance_x = colonyUI.config.zoom_x * (colony.map[ship[5]][0] - colony.map[ship[4]][0]),
            distance_y = colonyUI.config.zoom_y * (colony.map[ship[5]][1] - colony.map[ship[4]][1]);
        var distance = colonyUI.distance(colonyUI.config.zoom_x * colony.map[ship[5]][0], colonyUI.config.zoom_y * colony.map[ship[5]][1], colonyUI.config.zoom_x * colony.map[ship[4]][0], colonyUI.config.zoom_y * colony.map[ship[4]][1]);
        var x = colonyUI.config.zoom_x * ship[0],
            y = colonyUI.config.zoom_x * ship[1];
        ctx.lineWidth = 3;
        ctx.strokeStyle = colonyUI.color[ship[3]];
        ctx.beginPath();
        ctx.moveTo(x - distance_x / distance * ship[2], y - distance_y / distance * ship[2]);
        ctx.lineTo(x + distance_x / distance * ship[2], y + distance_y / distance * ship[2]);
        ctx.stroke();
    },
    drawStarSelectTip: function () {
        var x = colonyUI.config.zoom_x * colony.map[colony.lastSelect][0],
            y = colonyUI.config.zoom_y * colony.map[colony.lastSelect][1];
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 10 * colony.map[colony.lastSelect][2] + 50, 0, 2 * Math.PI, true);
        ctx.stroke();
    },
    select: function (e) {
        var cx = e.clientX,
            cy = e.clientY;
        if (typeof cx === 'undefined') {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        }
        var loc = colonyUI.windowTocanvas(canvas, cx, cy);
        var zx = parseInt(loc.x);
        var zy = parseInt(loc.y);
        var x = zx / colonyUI.config.zoom_x; //test only
        var y = zy / colonyUI.config.zoom_y; //test only
        document.getElementById("input_canvas").value ="X，Y："+ zx + "," + zy; //test only
        document.getElementById("input_map").value = "map X,Y: "+parseInt(x) + "," + parseInt(y); //test only
        if (pause) return;
        var match = false;
        for (var i = 0, len = colony.map.length; i < len; i++) {
            var star = colony.map[i];
            var starDistance = colonyUI.distance(zx, zy, colonyUI.config.zoom_x * star[0], colonyUI.config.zoom_y * star[1]);
            if (starDistance < 10 * star[2] + 30) {
                //document.getElementById("input_select").value = i; //test only
                if (typeof colony.lastSelect === 'undefined') {
                    colony.lastSelect = i;
                } else {
                    colony.shipMove(colony.lastSelect, i, colony.camp, colony.shipRatio);
                    colony.lastSelect = undefined;
                }
                match = true;
                break;
            }
        }
        if (!match) {
            //document.getElementById("input_select").value = "none"; //test only
            colony.lastSelect = undefined;
        }
    },
    distance: function (x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    calculateFpsAndTime: function () {
        var now = Date.now();
        if (pause) {
            lastTime = now;
            return 0;
        }
        timer += now - lastTime;
        var fps = 1000 / (now - lastTime);
        lastTime = now;
        document.getElementById("input_time").value = Math.floor(timer / 60000) + ":" + Math.floor(timer / 1000) % 60;
        return fps;
    },
    canvasResize: function () {
        var w = window.innerWidth,
            h = window.innerHeight;
        var s = w / 2 > h;
        ctx.canvas.width = s ? h * 2 : w;
        ctx.canvas.height = s ? h : w / 2;
        colonyUI.config.zoom_x = ctx.canvas.width / colonyUI.config.ZOOM_ON_X;
        colonyUI.config.zoom_y = ctx.canvas.height / colonyUI.config.ZOOM_ON_Y;
    },
    windowTocanvas: function (canvas, x, y) {
        var bbox = canvas.getBoundingClientRect();
        return {
            x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top * (canvas.height / bbox.height)
        };
    }
};
function animation() {
    if (!pause)
        colonyUI.updateFrame();
    window.requestAnimationFrame(animation);
}
function debugOn() {
    $("#input_canvas").show();
    $("#input_map").show();
    $("#ship_control").show();
    $("#ship_from_to").show();
}