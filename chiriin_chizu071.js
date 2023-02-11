var map;
// 中央子午線塔
var shigosenn_tou = [134+(59/60)+(58.0/3600), 35+(39/60)+(32.7/3600)];
var takagi_ooshima = [137.9306, 35.4995];

window.addEventListener('load', () => {
	initializeDB();
	// mapの生成
	const baseMap = new ol.layer.Tile({
		source: new ol.source.XYZ({
			attributions: ['https://maps.gsi.go.jp/development/ichiran.html'],
			url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	});
	map = new ol.Map({
		target: 'map',
		renderer: ['canvas', 'dom'],
		layers: [baseMap],
		controls: ol.control.defaults.defaults({
			attributionOptions: ({
				collapsible: false
			})
		}),
		//view: new ol.View({
		//	center: ol.proj.fromLonLat(takagi_ooshima),
		//	zoom: 16
		//})
		view: new ol.View({
			projection: "EPSG:3857",
			center: ol.proj.transform(takagi_ooshima, "EPSG:4326", "EPSG:3857"),
			maxZoom: 18,
			zoom: 16
		})
	});

	// アイコン機能の初期化
	addIconFeature();
	addCenterClossHair();

	// アイコン選択時の処理を登録
	///initializeSelect();

	// 移動操作終了
	map.on('moveend', ev => LocationChanged(ev));

	//クリック位置経緯度取得
	map.on('click', ev => onClickFunction(ev));

	map.addControl(new ol.control.ZoomSlider());
    // コントロール削除
	// map.removeControl(map.getControls().array_[0]); // [0]:+/-ボタン, [3]:ZoomSlider

	//addIcon(takagi_ooshima, IconStyle.DropRed);
	addLandPoint(takagi_ooshima, 'blue', '大島');
	//addFlagPoint(takagi_ooshima, 'blue', '大島');

});
// -------------------------------------
function onClickFunction(ev)
{
	const mode = document.MenuForm.Mode.value;
	const typ = document.MenuForm.Type.value;
	if (('1' == mode) && ('1' == typ))
	{
		const pt = document.MenuForm.Point.value;
		const [lon, lat] = ol.proj.transform(ev.coordinate, 'EPSG:3857', 'EPSG:4326');
		console.log("北緯(lat): " + lat + ", 東経(lon): " + lon);
		if ('旗' == pt)
		{
			addFlagPoint([lon, lat], 'blue', null);
			store_db('PrivatePoints', { 'kind': pt, 'lonlat': [lon,lat] });
			//store_db('PrivatePoints', { 'kind': '汎用', 'lonlat': takagi_ooshima, 'label': '親方宅(大島)' }
		}
		else
		{
			addLandPoint([lon, lat], 'red', null);
			store_db('PrivatePoints', { 'kind': pt, 'lonlat': [lon,lat] });
		}
	}
}
// -------------------------------------
function show_hide(element_id, flag=false)
{
	let item = document.querySelector(element_id);
	item.style.display = ('' == item.style.display) ? 'inline-block' : null;
	if (flag) LocationChanged(null);
	if (obj)
	{
		document.querySelector(obj).style.display = null;
		document.querySelector(other).style.display = 'inline-block';
	}
}
// -------------------------------------
function show_hide2(element_id, obj, icon1, icon2)
{
	let item = document.querySelector(element_id);
	let flag = ('' == item.style.display);
	item.style.display = flag ? 'flex' : null;
	obj.innerHTML = '<use href="' + (flag ? icon1 : icon2) + '"/>';
	onChangeMode();
}
// -------------------------------------
function float_to_dofun(arg)
{
	let num0 = Math.trunc(arg);
	let xxx = (arg - num0) * 60;
	let num1 = Math.trunc(xxx);
	xxx = (xxx - num1) * 60;
	let num2 = Math.trunc(xxx * 100) / 100;
	return [ num0, num1, num2 ];
}
// -------------------------------------
var IconStyle = {
	Bikkuri: 0,
	FlagRed: 1,
	FlagBlue: 2,
	DropRed: 3,
	CircleRed: 4,
	SevenStar: 5,
};
var IconStyles = Array.from( Object.values(IconStyle) );
// -------------------------------------
var vectorLayer;
function addIconFeature() {
	IconStyles[IconStyle.Bikkuri] = new ol.style.Style({
		image: new ol.style.Icon({
			src: 'iconst.png' // クリックさせる場合はpng限定かも？
		})
	});
	IconStyles[IconStyle.FlagRed] = new ol.style.Style({
		image: new ol.style.Icon({ src: 'flag_red.svg?' })
	});
	IconStyles[IconStyle.FlagBlue] = new ol.style.Style({
		image: new ol.style.Icon({ src: 'flag_blue.svg?' })
	});
	IconStyles[IconStyle.DropRed] = new ol.style.Style({
		image: new ol.style.Icon({ src: 'point_black.svg?', scale: 0.6 }),
		text: new ol.style.Text({
			text: '大島',
			offsetY: 28,
			scale: 1.5,
			fill: new ol.style.Fill({ color: 'black' }),
			backgroundStroke: new ol.style.Stroke({ color: 'blue' })
		})
	});
	IconStyles[IconStyle.CircleRed] = new ol.style.Style({
		image: new ol.style.Circle({
			radius: 8,
			fill: new ol.style.Fill({ color: 'red' }),
			stroke: new ol.style.Stroke({ color: 'white', width: 3 })
		})
	});
	IconStyles[IconStyle.SevenStar] = new ol.style.Style({
		image: new ol.style.RegularShape({
			points: 7,
			radius1: 12,
			radius2: 20,
			fill: new ol.style.Fill({ color: 'red' })
		})
	});

	vectorLayer = new ol.layer.Vector({
		source: new ol.source.Vector(), style: IconStyles[IconStyle.Bikkuri]
	});

	// マップの中央座標の算出
	//let coordinate = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');

	map.addLayer(vectorLayer);
}
// -------------------------------------
function addIcon(lonlat, typ)
{
	var f = new ol.Feature(new ol.geom.Point(
		ol.proj.transform(lonlat, 'EPSG:4326', 'EPSG:3857')));
	f.setStyle(IconStyles[typ]);
	vectorLayer.getSource().addFeature(f);
}
// -------------------------------------
function addFlagPoint(lonlat, color, label)
{
	addPoint(lonlat,
		'viewBox="0 0 39 25" width="29px" height="40px"'
			+ ` style="fill:${color}; stroke:white;">`
			+ '<path d="M 13 5 c 3 1 10 4 9 7 l 0 1 c 0 0 1 4 6 4'
			+ ' c -1 3 -3 4 -7 4 c -5 0 -4 -2 -4 -2 s 4 -2 -8 -4 L 13 5 z"/>'
			+ '<path d="M 4 25 c 0 1 -3 2 -3 -1 l 9 -22 c 0 -1 3 -2 3 1 L 4 25 z"/>',
		2, [-12, 10], label);
}
// -------------------------------------
function addLandPoint(lonlat, color, label)
{
	addPoint(lonlat,
		'viewBox="0 0 30 41" width="30" height="81"'
			+ ` style="fill:${color}">`
			+ '<path d="M 3,24 a 15 15 210 1 1 24,0 l -12,16 z"/>'
			+ '<circle cx="15" cy="15" r="12" style="fill:white;"/>'
			+ '<circle cx="15" cy="15" r="4"/>',
		1, [0, 20], label);
}
// -------------------------------------
function addPoint(lonlat, svg, scale = null, offset = null, label = null)
{
	let tmp1 = {
		src: 'data:image/svg+xml;utf8,<svg version="1.1"'
			+ ' xmlns="http://www.w3.org/2000/svg"'
			+ ' xmlns:xlink="http://www.w3.org/1999/xlink" '
			+ svg + '</svg>'
	};
	if (null !== scale) tmp1['scale'] = scale;
	if (null !== offset) tmp1['offset'] = offset;
	var img = new ol.style.Icon(tmp1);

	let tmp2 = { image: img };
	if (null !== label)
		 tmp2['text'] = 
			new ol.style.Text({
				text: label,
				offsetY: 12,
				scale: 1.5,
				fill: new ol.style.Fill({ color: 'black' }),
				backgroundFill: new ol.style.Fill({ color: '#fffa' }),
				backgroundStroke: new ol.style.Stroke({ color: 'white' })
			});
	var style = new ol.style.Style(tmp2);

	var f = new ol.Feature(new ol.geom.Point(
		ol.proj.transform(lonlat, 'EPSG:4326', 'EPSG:3857')));
	f.setStyle(style);
	vectorLayer.getSource().addFeature(f);
	return f;
}
// -------------------------------------
function addCenterClossHair()
{
	var closshairIcon = addPoint(takagi_ooshima,
		'viewBox="0 0 81 81" width="81" height="81"'
			+ ' style="stroke:green; opacity: 0.6">'
			+ '<path d="M 0,40 h 81"/><path d="M 40,0 v 81"/>', 2);
	// 中心線を常に中央に表示
	map.getView().on('change:center', (evt) =>
	{
		closshairIcon.setGeometry(new ol.geom.Point( map.getView().getCenter() ));
		map.render();
	});
}
// -------------------------------------
const DB_VERSION = 1;
const DB_NAME= 'mapDB';
function initializeDB()
{
	console.log('initializeDB');
	const openReq = indexedDB.open(DB_NAME, DB_VERSION); // DBがなければ新規作成
	// onupgradeneededは、DBのバージョン更新(DBの新規作成も含む)時のみ実行
	openReq.onupgradeneeded = function(event)
	{
		const db = openReq.result;
		switch(db.version)
		{
			case 0: // 新規作成
			//	db.createObjectStore('SharedPoints', { keyPath: 'idx' });
			//	db.createObjectStore('SharedLines',  { keyPath: 'idx' });
			//	db.createObjectStore('SharedFigure', { keyPath: 'idx' });
			//	let os = db.createObjectStore('PrivatePoints', { keyPath: 'idx', autoIncrement: true });
			//	os.createIndex("lonlat", "hours", { unique: false });
				db.createObjectStore('PrivatePoints', { autoIncrement: true });
			//	db.createObjectStore('PrivateLines',  { keyPath: 'idx', autoIncrement: true });
			//	db.createObjectStore('PrivateFigure', { keyPath: 'idx', autoIncrement: true });
				break;
				// kind: 汎用, 駐車場所, 立間, 出現地点, 出発点, 目的地, 経由地, P1, P2, P3
				// kind: 汎用, 足跡, 囲み線, 獣道, 廃道, 私道, 鉄柵, 防獣網, 高圧線,
				// 水路, 用水管, 禁猟区, 銃禁区, 要配慮, 要注意
			case 1: // 現状がver.1の際には更新
				break;
		}
		console.log(`db upgrade ${db.version} -> ${DB_VERSION}`);
	}
	openReq.onerror = function(event)
	{
		console.log('db open error'); // 接続失敗
	}
	openReq.onsuccess = function(event)
	{
		console.log('db open success');
		let db = event.target.result;
		db.close();
	}
}
// -------------------------------------
function store_db(store_name, data)
{
	console.log(`store_db:${store_name} ${JSON.stringify(data)}`);
	//var data = {id : 'A1', name : 'test'};

	const openReq = indexedDB.open(DB_NAME);
	openReq.onsuccess = function(event)
	{
		const db = openReq.result;
		//const db = event.target.result;
		const trans = db.transaction(store_name, 'readwrite');
		const store = trans.objectStore(store_name);
		const putReq = store.put(data);

		putReq.onsuccess = function(){
			console.log('put data success');
		}

		trans.oncomplete = function(){
			// トランザクション完了時(putReq.onsuccessの後)に実行
			console.log('transaction complete');
		}
	}
}
// -------------------------------------
// アイコン選択時の機能
function initializeSelect() {
	var select = new ol.interaction.Select();
	map.addInteraction(select);
	var selectedFeatures = select.getFeatures();
	var selectedStyle = new ol.style.Style({
		image: new ol.style.Circle({
			radius: 8,
			fill: new ol.style.Fill({ color: '#FF0000' }),
			stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
		})
	});
	selectedFeatures.on(['add', 'remove'], function () {
		//console.log('selectedFeatures');
		var features = selectedFeatures.getArray();
		if (0 < features.length) {
			features.map(f => { f.setStyle(selectedStyle); });
		}
		else {
			//console.log('no feature');// なぜ元に戻るかが不明。
		}
	});
}
// -------------------------------------
function LocationChanged(event)
{
	if ('undefined' == typeof LocationChanged.zoomLevel)
		LocationChanged.zoomLevel = document.querySelector('#zoomLevel');
	if ('undefined' == typeof LocationChanged.positionLabel)
		LocationChanged.positionLabel = document.querySelector('#positionLabel');
	if ('undefined' == typeof LocationChanged.positionSelect)
		LocationChanged.positionSelect = document.querySelector('#positionSelect');

	let value = map.getView().getZoom();
	LocationChanged.zoomLevel.textContent = value.toPrecision(3);

	// 座標変換 EPSG:3857 : 地図アプリの緯度経度, 'EPSG:4326' : GPSで用いる世界測地系
	const m = map.getView().getCenter();
	const [lon, lat] = ol.proj.transform(m, 'EPSG:3857', 'EPSG:4326');
	console.log(`map=${m[0]} / ${m[1]}, gps=${lon} / ${lat}`);
	let lon2, lat2;
	switch (LocationChanged.positionSelect.value)
	{
		case "0": default:
			LocationChanged.positionLabel.innerHTML =
				`${lat.toPrecision(8)}&deg;N, ${lon.toPrecision(8)}&deg;E`;
			break;
		case "1":
			lon2 = float_to_dofun(lon);
			lat2 = float_to_dofun(lat);
			LocationChanged.positionLabel.innerHTML =
				`${lat2[0]}&deg;${lat2[1]}&prime;${lat2[2]}&Prime;N, ${lon2[0]}&deg;${lon2[1]}&prime;${lon2[2]}&Prime;`;
			break;
		case "2":
			lon2 = float_to_dofun(lon);
			lat2 = float_to_dofun(lat);
			LocationChanged.positionLabel.innerHTML =
				`北緯:${lat2[0]}度${lat2[1]}分${lat2[2]}秒, 東経:${lon2[0]}度${lon2[1]}分${lon2[2]}秒`;
			break;
	}
}
// -------------------------------------
// -------------------------------------
// -------------------------------------
