var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d'),
    background = new Image();
background.src = 'background.jpg';
background.onload = function (e) {
    context.drawImage(background, 0, 0);
};

function windowTocanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();
    return {
        x: x - bbox.left * (canvas.width / bbox.width),
        y: y - bbox.top * (canvas.height / bbox.height)
    };
}
var colony = {
    map: [], //x,y,size,camp,type,population
    color: ["DimGray", "Orchid", "SpringGreen", "OrangeRed", "DodgerBlue", "Black"],
    init: function () {
        context.canvas.width = window.innerWidth - 60;
        context.canvas.height = window.innerHeight - 80;
        if (background.complete)
            context.drawImage(background, 0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = 2;
        context.font = '30pt Arial';
        context.fillStyle = 'cornflowerblue';
        context.strokeStyle = 'black';
        context.fillText("alpha version!", 50, 50);
        this.loadMap();
    },
    updateMap: function () {
        context.canvas.width = window.innerWidth - 60;
        context.canvas.height = window.innerHeight - 80;
        var zoom_x = context.canvas.width / 80;
        var zoom_y = context.canvas.height / 60;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (background.complete)
            context.drawImage(background, 0, 0, context.canvas.width, context.canvas.height);
        this.map.forEach(
            function (star) {
                var x = zoom_x * star[0],
                    y = zoom_y * star[1],
                    r = 5 * star[2],
                    populationStr = (star[5]).toString();
                //console.log(populationStr);
                var textWidth = context.measureText(populationStr).width; //some bug in first run
                //type = star[4]; //only one type now
                context.beginPath();
                context.arc(x, y, r + 10, 0, 2 * Math.PI, true); //only when type==1
                context.stroke();
                context.fillStyle = colony.color[star[3]];
                context.fill();
                context.font = '10pt Arial';
                context.fillText(populationStr, x - textWidth / 2, y + r + 25);
            }
        );
    },
    loadMap: function () {
        try {
            $.getJSON("map.json", function (data) {
                $("#startBtn").hide();
                var len = data.maps.length;
                var text = "<h3 id=\"choose_tip\">Choose a map.</h3><p>";
                var map_n = 0;
                for (var i = 1; i <= len; i++) {
                    text += "<button type=\"button\" class=\"choose_map\" id=\"map" + i + "\">" + i + "</button>"
                }
                $("#startBtn").after(text);
                $("button.choose_map").click(function () {
                    map_n = parseInt($(this).attr("id").substring(3));
                    colony.map = data.maps[map_n - 1];
                    colony.map.forEach(function (star) {
                        if (star[3] != 0 && star[5] == 0) {
                            star[5] = star[2] * 10;
                        }
                    });
                    colony.updateMap(); //Should change
                    $("button.choose_map").hide();
                    $("#choose_tip").hide();
                });
                window.addEventListener("resize", function () {
                    colony.updateMap();
                })
                canvas.onclick = function (e) {
                    var zoom_x = context.canvas.width / 80;
                    var zoom_y = context.canvas.height / 60;
                    var loc = windowTocanvas(canvas, e.clientX, e.clientY)
                    var zx = parseInt(loc.x);
                    var zy = parseInt(loc.y);
                    var x = zx / zoom_x;
                    var y = zy / zoom_y;
                    document.getElementById("input_window").value = e.clientX + "," + e.clientY;
                    document.getElementById("input_canvas").value = zx + "," + zy;
                    document.getElementById("input_map").value = parseInt(x) + "," + parseInt(y);
                }
            });
        } catch (e) {
            console.error("Can\'t load map.json!");
        }
    },
}
//window.onload = colony.init();