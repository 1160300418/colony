var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d'),
    background = new Image();
background.src = 'background.jpg';
var lastTime = 0; //calculate Fps
var pause = false;
var colony = {
    map: [], //0:x,1:y,2:size,3:camp,4:type,5:population array,6:orbit data array,7:capture() cent.8:atWar?
    ship: [], //0:x,1:y,2:population,3:camp,4:source,5:target
    config: {
        maxPopulation:20,
        initPopulation:10,
        maxCamp:6,//match colonyUI.color.length
        growthSpeed:0.0005,
        shipSpeed: 0.003,
        combatSpeed: 0.001,
        captureSpeed: 0.004,
        aiThinkSpeed: 500
    },
    camp: 1,
    shipRatio: 1,
    lastSelect: undefined,
    loadMap: function () {
        try {
            $.getJSON("map.json", function (data) {
                colonyUI.controlUI(data, function (n) {
                    colony.map = data.maps[n - 1];
                    colony.map.forEach(function (star) {
                        star[5] = new Array(colony.config.maxCamp);
                        if (star[3] != 0) {
                            star[5][star[3]] = star[2] * colony.config.initPopulation; //initialize population 
                        }
                    });
                });
            });
        } catch (e) {
            console.error("Can\'t load map.json!");
        }
    },
    shipMove: function (from, to, camp,cent) {//cent
        if (from == to) return;
        if (!colony.map[from][5][camp]) return;
        if (!colony.map[to][5][camp]) colony.map[to][5][camp] = 0;
        let movePopulation = parseInt((colony.map[from][5][camp] * cent).toFixed())
        colony.map[from][5][camp] = parseInt(((1 - cent) * colony.map[from][5][camp]).toFixed());
        var ship = new Array();
        ship[0] = colony.map[from][0];
        ship[1] = colony.map[from][1];
        ship[2] = movePopulation;
        ship[3] = camp;
        ship[4] = from;
        ship[5] = to;
        colony.ship.push(ship);
    },
    shipOrbit: function (aship, index) {
        var distance_x = (colony.map[aship[5]][0] - colony.map[aship[4]][0]), //to-from
            distance_y = (colony.map[aship[5]][1] - colony.map[aship[4]][1]);
        var distance = colonyUI.distance(colony.map[aship[5]][0], colony.map[aship[5]][1], colony.map[aship[4]][0], colony.map[aship[4]][1]);
        aship[0] += distance_x / distance * colony.config.shipSpeed * colonyUI.fps;
        aship[1] += distance_y / distance * colony.config.shipSpeed * colonyUI.fps;
        if ((aship[0] - colony.map[aship[5]][0]) * distance_x > 0 || (aship[1] - colony.map[aship[5]][1]) * distance_y > 0) {
            colony.map[aship[5]][5][aship[3]] += aship[2];
            delete colony.ship[index];
        }
    },
    starOrbit: function (star) {
        //wait
    },
    combat: function (star) {
        if(!star[8]) star[8]=1;
        for(let i=0,len=star[5].length;i<len;i++)
        {
            if(!star[5][i])continue;
            if(star[5][i]<0)star[5][i]=undefined;
            star[5][i]-=colony.config.combatSpeed* colonyUI.fps;
        }
    },
    capture: function (star) {
        if (!star[7]) star[7] = 0;
        star[7]+=colony.config.captureSpeed* colonyUI.fps;
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
    grow:function(star){
        if(star[5][star[3]]<star[2] * colony.config.maxPopulation)
        star[5][star[3]]+=colony.config.growthSpeed*colonyUI.fps;
        if(star[5][star[3]]>star[2] * (colony.config.maxPopulation+colony.config.initPopulation))
        star[5][star[3]]-=colony.config.growthSpeed*colonyUI.fps;
    },
    ai:function(){
        window.setInterval(function(){
            if(!pause)
            {
                for(let aiCamp=1;aiCamp<colony.config.maxCamp;aiCamp++){
                    if(aiCamp==colony.camp)continue;
                    var from=undefined,to=undefined,cent=undefined;
                    var len=colony.map.length;
                    var population=0;
                    for(let i=0;i<len;i++){
                        let star=colony.map[i];
                        if(!star[5][aiCamp]||star[5][aiCamp]<5)continue;
                        if(!!star[7])continue;
                        if(!!star[8]){
                            from=i;
                            break;
                        }
                        if(!star[8]&&star[5][aiCamp]>population){
                            population=star[5][aiCamp];
                            from=i;
                        }
                    }
                    population=1000;
                    if(typeof (from) == 'undefined')continue;
                    for(let i=0;i<len;i++){
                        let star=colony.map[i];
                        if((star[3]==aiCamp)&&(!!star[7]||!!star[8])){
                            to=i;
                            let enemyMax=0;
                            for(let j=0;j<star[5].length;j++){
                                if(!!star[5][j]&&star[5][j]>enemyMax)enemyMax=star[5][j];
                            }
                            cent=enemyMax/colony.map[from][5][aiCamp];
                            if(cent<0.9)cent+=0.1;
                            break;
                        }
                        if(star[3]==0){
                            to=i;
                            cent=colony.map[from][aiCamp]*0.5>10?0.5:10/colony.map[from][5][aiCamp];
                            if(Math.random()>0.5)
                                break;
                        }
                        if(!star[7]&&!star[8]&&star[5][star[3]]<population){
                            population=star[5][star[3]];
                            to=i;
                            cent=population/colony.map[from][5][aiCamp];
                            if(cent<0.9)cent+=0.1;
                            if(Math.random()>0.5)
                                break;
                        }
                    }
                if((typeof (from) !='undefined')&&(typeof (to) !='undefined')&&cent>0&&cent<=1)
                colony.shipMove(from,to,aiCamp,cent);
                }
            }
        },colony.config.aiThinkSpeed);
    },
    winChick:function(){
        if(!colony.map[0])return;
        if(pause)return;
        var win=true;
        var fail=true;
        for(let i=0,len=colony.map.length;i<len;i++){
            if(colony.map[i][3]!=colony.camp)
                win=false;
            else
                fail=false;
        }
        if(win){
            pause=true;
            alert("Congratulation,you are winner!");
        }
        if(fail){
            pause=true;
            alert("You are defeated!");
        }
    }
}
colonyUI = {
    config: {
        ZOOM_ON_X: 100,
        ZOOM_ON_Y: 50,
        zoom_x: 20,
        zoom_y: 20
    },
    fps: undefined,
    color: ["DimGray", "Orchid", "SpringGreen", "OrangeRed", "DodgerBlue", "Black"],
    drawBackground: function () {
        if (background.complete)
            context.drawImage(background, 0, 0, context.canvas.width, context.canvas.height);
    },
    init: function () {
        colonyUI.canvasResize();
        colonyUI.drawBackground();
        context.textAlign = "center";
        context.textBaseline = "middle";
        colony.loadMap();
    },
    controlUI: function (data, dataInit) {
        var len = data.maps.length;
        var text = "<h3 id=\"choose_tip\">Choose a map.</h3><p>";
        var map_n = 0;
        for (var i = 1; i <= len; i++) {
            text += "<button type=\"button\" class=\"choose_map\" id=\"map" + i + "\">" + i + "</button>"
        }
        $("#pos").before(text);
        $("button.choose_map").click(function () {
            map_n = parseInt($(this).attr("id").substring(3));//mapX
            dataInit(map_n);
            window.requestAnimationFrame(animation);
            colony.ai();
            $("button.choose_map").hide();
            $("#choose_tip").hide();
            $("#pos").show();
        });
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
            var shipControlInput = document.getElementById("ship_from_to").value;//from,to,camp
            let from = parseInt(shipControlInput),
                to = parseInt(shipControlInput.substring(from.toString().length + 1)),
                camp = parseInt(shipControlInput.substring(from.toString().length + to.toString().length + 2));
            colony.shipMove(from, to, camp,colony.shipRatio);
        };
        document.getElementById("shipRatio").onchange = function (e) {
            document.getElementById("shipRatioText").innerText = "shipRatio:" + this.value + "%";
            colony.shipRatio = parseInt(this.value) / 100;
        }
    },
    updateFrame: function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        colonyUI.drawBackground();
        colonyUI.fps = colonyUI.calculateFps();
        colony.map.forEach(function (star, index) {
            colonyUI.drawStar(star, index);
            colonyUI.drawShipOnStar(star, index);
        });
        colony.ship.forEach(function (aship, index) {
            colony.shipOrbit(aship, index);
            colonyUI.drawShipOnWay(aship);
        });
        if (typeof (colony.lastSelect) != 'undefined') {
            colonyUI.drawStarSelectTip();
        };
        colony.winChick();
        document.getElementById("input_fps").value = colonyUI.fps.toFixed() + ' fps';
    },
    drawStar: function (star, index) {
        var x = colonyUI.config.zoom_x * star[0],
            y = colonyUI.config.zoom_y * star[1];
        switch (star[4]) {
            case 1:
                context.lineWidth = 2;
                context.fillStyle = colonyUI.color[star[3]];
                context.strokeStyle = "black";
                context.beginPath();
                context.arc(x, y, 10 * star[2] + 10, 0, 2 * Math.PI, true);
                context.stroke();
                context.fill();
                break;
        }
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = '10pt Arial'; //test only
        context.fillStyle = "black"; //test only
        context.fillText("index:" + index, x, y); //test only
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
        if (totalCamp == 1 && (!star[5][star[3]])) capturing = true;
        for (let i = 0, len = star[5].length, populationCount = 0; i < len; i++) {
            text = star[5][i];
            if (!text) continue;
            context.fillStyle = colonyUI.color[i];
            context.strokeStyle = colonyUI.color[i];
            if (!populationCount && text) populationCount = totalPopulation / 4 - text / 2;
            if (atWar) {
                context.lineWidth = 10;
                context.beginPath();
                context.arc(x, y, 10 * star[2] + 35, (populationCount / totalPopulation) * 2 * Math.PI, ((populationCount + text) / totalPopulation) * 2 * Math.PI, false);
                context.stroke();
                context.lineWidth = 2;
                context.fillText(text.toFixed(), x + (10 * star[2] + 20) * Math.cos((populationCount + text / 2) / totalPopulation * Math.PI * 2), y + (10 * star[2] + 20) * Math.sin((populationCount + star[5][i] / 2) / totalPopulation * Math.PI * 2));
                colony.combat(star);
            } else{
                    context.fillText(text.toFixed(), x, y + (10 * star[2] + 20));
                    star[8]=undefined;
            }
            if (capturing) {
                var cent = colony.capture(star);
                context.lineWidth = 5;
                context.beginPath();
                context.arc(x, y, 10 * star[2] + 35, 0, cent / 100 * 2 * Math.PI, false);
                context.stroke();
            }else{
                star[7]=undefined;
            }
            if((!atWar)&&(!capturing)){
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
        context.lineWidth = 3;
        context.strokeStyle = colonyUI.color[ship[3]];
        context.beginPath();
        context.moveTo(x - distance_x / distance * ship[2], y - distance_y / distance * ship[2]);
        context.lineTo(x + distance_x / distance * ship[2], y + distance_y / distance * ship[2]);
        context.stroke();
    },
    drawStarSelectTip: function () {
        var x = colonyUI.config.zoom_x * colony.map[colony.lastSelect][0],
            y = colonyUI.config.zoom_y * colony.map[colony.lastSelect][1];
        context.strokeStyle = "black";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(x, y, 10 * colony.map[colony.lastSelect][2] + 50, 0, 2 * Math.PI, true);
        context.stroke();
    },
    select: function (e) {
        var cx = e.clientX,
            cy = e.clientY;
        if (typeof cx == 'undefined') {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        }
        var loc = colonyUI.windowTocanvas(canvas, cx, cy)
        var zx = parseInt(loc.x);
        var zy = parseInt(loc.y);
        var x = zx / colonyUI.config.zoom_x; //test only
        var y = zy / colonyUI.config.zoom_y; //test only
        document.getElementById("input_canvas").value = zx + "," + zy; //test only
        document.getElementById("input_map").value = parseInt(x) + "," + parseInt(y); //test only
        if (pause) return;
        var match = false;
        for (var i = 0, len = colony.map.length; i < len; i++) {
            var star = colony.map[i];
            var starDistance = colonyUI.distance(zx, zy, colonyUI.config.zoom_x * star[0], colonyUI.config.zoom_y * star[1]);
            if (starDistance < (10 * star[2] + 30)) {
                document.getElementById("input_select").value = i; //test only
                if (typeof (colony.lastSelect) == 'undefined') {
                    colony.lastSelect = i;
                } else {
                    colony.shipMove(colony.lastSelect, i, colony.camp,colony.shipRatio);
                    colony.lastSelect = undefined;
                }
                match = true;
                break;
            }
        }
        if (!match) {
            document.getElementById("input_select").value = "none"; //test only
            colony.lastSelect = undefined;
        }
    },
    distance: function (x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    calculateFps: function () {
        var now = (+new Date),
            fps = 1000 / (now - lastTime);
        lastTime = now;
        return fps;
    },
    canvasResize: function () {
        var w = window.innerWidth,
            h = window.innerHeight;
        var s = w / 2 > h;
        context.canvas.width = s ? h * 2 : w;
        context.canvas.height = s ? h : w / 2;
        colonyUI.config.zoom_x = context.canvas.width / colonyUI.config.ZOOM_ON_X
        colonyUI.config.zoom_y = context.canvas.height / colonyUI.config.ZOOM_ON_Y
    },
    windowTocanvas: function (canvas, x, y) {
        var bbox = canvas.getBoundingClientRect();
        return {
            x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top * (canvas.height / bbox.height)
        };
    }
}
window.onload = colonyUI.init();

function animation() {
    if (!pause)
        colonyUI.updateFrame();
    window.requestAnimationFrame(animation);
}
