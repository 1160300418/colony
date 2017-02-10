var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d'),
    background = new Image();
const ZOOM_ON_X = 100,
    ZOOM_ON_Y = 50;
background.src = 'background.jpg';
var lastTime=0;//calculate Fps
var colony = {
        map: [], //0:x,1:y,2:size,3:camp,4:type,5:population array,6:orbit data array
        ship: [], //0:x,1:y,2:population,3:camp,4:target
        lastSelect: undefined,
        loadMap: function () {
            try {
                $.getJSON("map.json", function (data) {
                    colonyUI.chooseMapUI(data, function (n) {
                        colony.map = data.maps[n - 1];
                        colony.map.forEach(function (star) {
                            star[5] = new Array(6);
                            if (star[3] != 0) {
                                star[5][star[3]] = star[2] * 10; //initialize population 
                            }
                        });
                    });
                });
            } catch (e) {
                console.error("Can\'t load map.json!");
            }
        },
        shipMove: function (i) {//many bugs
            var from = colony.lastSelect,
                to = i;
            if(from==to)return;
            colony.lastSelect = undefined;
            //animation
            colony.map[to][5][from] = colony.map[from][5][from];
            colony.map[from][5][from] = undefined;
        },
        combat: function () {

        }
    },
    colonyUI = {
        color: ["DimGray", "Orchid", "SpringGreen", "OrangeRed", "DodgerBlue", "Black"],
        drawBackground: function () {
            if (background.complete)
                context.drawImage(background, 0, 0, context.canvas.width, context.canvas.height);
        },
        init: function () {
            colonyUI.canvasResize();
            colonyUI.drawBackground();
            context.font = '30pt Arial';
            context.fillStyle = 'cornflowerblue';
            colony.loadMap();
        },
        chooseMapUI: function (data, dataInit) {
            var len = data.maps.length;
            var text = "<h3 id=\"choose_tip\">Choose a map.</h3><p>";
            var map_n = 0;
            for (var i = 1; i <= len; i++) {
                text += "<button type=\"button\" class=\"choose_map\" id=\"map" + i + "\">" + i + "</button>"
            }
            $("#pos").before(text);
            $("button.choose_map").click(function () {
                map_n = parseInt($(this).attr("id").substring(3));
                dataInit(map_n);
                window.requestAnimationFrame(animation);
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
        },
        updateFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
            colonyUI.drawBackground();
            colony.map.forEach(function (star, index) {
                colonyUI.drawStar(star, index);
            });
            colony.ship.forEach(function (ship) {
                colonyUI.drawShip(ship);
            });
            if (colony.lastSelect) {
                var zoom_x = context.canvas.width / ZOOM_ON_X,
                    zoom_y = context.canvas.height / ZOOM_ON_Y;
                var x = zoom_x * colony.map[colony.lastSelect][0],
                    y = zoom_y * colony.map[colony.lastSelect][1];
                context.lineWidth = 2;
                context.beginPath();
                context.arc(x, y, 10 * colony.map[colony.lastSelect][2] + 50, 0, 2 * Math.PI, true);
                context.stroke();
            };
            document.getElementById("input_fps").value =colonyUI.calculateFps().toFixed() + ' fps';
        },
        drawStar: function (star, index) {
            var zoom_x = context.canvas.width / ZOOM_ON_X,
                zoom_y = context.canvas.height / ZOOM_ON_Y;
            var x = zoom_x * star[0],
                y = zoom_y * star[1];
            //type = star[4]; //only one type now
            context.lineWidth = 2;
            context.beginPath();
            context.arc(x, y, 10 * star[2] + 10, 0, 2 * Math.PI, true); //only when type==1//magic number
            context.stroke();
            context.fillStyle = colonyUI.color[star[3]];
            context.fill();
            context.font = '10pt Arial';
            context.fillStyle = "black";
            context.fillText("index:" + index, x, y); //test only
            var totalCampNum = 0,
                campCount = 0,
                totalPopulation = 0,
                populationCount;
            for (var i = 0, len = star[5].length; i < len; i++) {
                if (!star[5][i]) continue;
                totalCampNum++;
                totalPopulation += star[5][i];
            }
            star[5].forEach(function (text, i) {//many bugs
                if (!text) return;
                var populationStr = text.toString(),
                    textWidth = context.measureText(populationStr).width;
                context.fillStyle = colonyUI.color[i];
                context.fillText(populationStr, x + (10 * star[2] + 10) * Math.sin(campCount / totalCampNum * Math.PI * 2) - textWidth / 2, y + (10 * star[2] + 10) * Math.cos(campCount / totalCampNum * Math.PI * 2) + 15); //magic number
                context.lineWidth = 4;
                context.beginPath();
                context.arc(x, y, 10 * star[2] + 15, (populationCount / totalPopulation * 2 - 0.5) * Math.PI, ((populationCount + star[5][i]) / totalPopulation * 2 - 0.5) * Math.PI, true);
                context.stroke();
                campCount++;
                populationCount += star[5][i];
            });
        },
        drawShip: function (ship) {},
        select: function (e) {
            var zoom_x = context.canvas.width / ZOOM_ON_X;
            var zoom_y = context.canvas.height / ZOOM_ON_Y;
            var cx = e.clientX,
                cy = e.clientY;
            if (!cx) {
                cx = e.touches[0].clientX;
                cy = e.touches[0].clientY;
            }
            var loc = colonyUI.windowTocanvas(canvas, cx, cy)
            var zx = parseInt(loc.x);
            var zy = parseInt(loc.y);
            var x = zx / zoom_x; //test only
            var y = zy / zoom_y; //test only
            document.getElementById("input_canvas").value = zx + "," + zy;
            document.getElementById("input_map").value = parseInt(x) + "," + parseInt(y); //test only
            var match = false;
            for (var i = 0, len = colony.map.length; i < len; i++) {
                star = colony.map[i];
                var starDistance = colonyUI.distance(zx, zy, zoom_x * star[0], zoom_y * star[1]);
                if (starDistance < (10 * star[2] + 30)) {
                    document.getElementById("input_select").value = "select now:" + i+"last:"; //test only
                    if (!colony.lastSelect) {
                        colony.lastSelect = i;
                    } else {
                        colony.shipMove(i);
                    }
                    match = true;
                    break;
                }
            }
            if (!match) {
                document.getElementById("input_select").value = "";
                colony.lastSelect = undefined;
            }
            document.getElementById("input_select").value += colony.lastSelect ? colony.lastSelect : "none";
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
            w = window.innerWidth;
            h = window.innerHeight;
            var s = w / 2 > h;
            context.canvas.width = s ? h * 2 : w;
            context.canvas.height = s ? h : w / 2;
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
    colonyUI.updateFrame();
    window.requestAnimationFrame(animation);
}