var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d'),
    background = new Image();
const ZOOM_ON_X = 80,
    ZOOM_ON_Y = 60;
background.src = 'background.jpg';
var colony = {
        map: [], //x,y,size,camp,type,population array,orbit array
        loadMap: function () {
            try {
                $.getJSON("map.json", function (data) {
                    colonyUI.chooseMapUI(data, function (n) {
                        colony.map = data.maps[n - 1];
                        colony.map.forEach(function (star) {
                            if (star[3] != 0 && star[5] == 0) {
                                star[5] = star[2] * 10; //initialize population 
                            }
                        });
                    });
                });
            } catch (e) {
                console.error("Can\'t load map.json!");
            }
        },
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
            //context.lineWidth = 5;//any function?
            context.font = '30pt Arial';
            context.fillStyle = 'cornflowerblue';
            context.strokeStyle = 'black';
            context.fillText("alpha version!", 50, 50); //test only!
            canvas.addEventListener("click", function (e) { //show XY ,debug only
                var zoom_x = context.canvas.width / ZOOM_ON_X;
                var zoom_y = context.canvas.height / ZOOM_ON_Y;
                var loc = colonyUI.windowTocanvas(canvas, e.clientX, e.clientY)
                var zx = parseInt(loc.x);
                var zy = parseInt(loc.y);
                var x = zx / zoom_x;
                var y = zy / zoom_y;
                document.getElementById("input_canvas").value = zx + "," + zy;
                document.getElementById("input_map").value = parseInt(x) + "," + parseInt(y);
            });
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
                colonyUI.animation();
                $("button.choose_map").hide();
                $("#choose_tip").hide();
                $("#pos").show();
            });
            window.addEventListener("resize", function () {
                colonyUI.canvasResize();
            });
        },
        updateFrame: function () {
            var zoom_x = context.canvas.width / ZOOM_ON_X;
            var zoom_y = context.canvas.height / ZOOM_ON_Y;
            context.clearRect(0, 0, canvas.width, canvas.height);
            colonyUI.drawBackground();
            colony.map.forEach(
                function (star) {
                    var x = zoom_x * star[0],
                        y = zoom_y * star[1],
                        r = 5 * star[2], //magic number
                        populationStr = (star[5]).toString(),
                        textWidth = context.measureText(populationStr).width;
                    //type = star[4]; //only one type now
                    context.beginPath();
                    context.arc(x, y, r + 10, 0, 2 * Math.PI, true); //only when type==1//magic number
                    context.stroke();
                    context.fillStyle = colonyUI.color[star[3]];
                    context.fill();
                    context.font = '10pt Arial';
                    context.fillText(populationStr, x - textWidth / 2, y + r + 25); //magic number
                }
            );
        },
        animation:function(){
            colonyUI.updateFrame();
        },
        canvasResize: function () {
            const CANVAS_LEFT = 0.95,
                CANVAS_TOP = 0.9
                context.canvas.width = window.innerWidth * CANVAS_LEFT;
            context.canvas.height = window.innerHeight * CANVAS_TOP;
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