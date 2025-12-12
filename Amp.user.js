// IITC plugin: Portal to AMap (Gaode)

function wrapper(plugin_info) {

  if (typeof window.plugin !== 'function') window.plugin = function(){};
  window.plugin.portal2amap = {};
  const self = window.plugin.portal2amap;

  self.id = 'portal2amap';
  self.title = '打开高德地图';
  self.version = '0.1.2';

  /* ---------- 坐标转换 ---------- */

  self.outOfChina = function(lat, lon) {
    return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
  };

  self.transformLat = function(x, y) {
    const pi = Math.PI;
    let ret = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x));
    ret += (20*Math.sin(6*x*pi) + 20*Math.sin(2*x*pi)) * 2/3;
    ret += (20*Math.sin(y*pi) + 40*Math.sin(y/3*pi)) * 2/3;
    ret += (160*Math.sin(y/12*pi) + 320*Math.sin(y*pi/30)) * 2/3;
    return ret;
  };

  self.transformLon = function(x, y) {
    const pi = Math.PI;
    let ret = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x));
    ret += (20*Math.sin(6*x*pi) + 20*Math.sin(2*x*pi)) * 2/3;
    ret += (20*Math.sin(x*pi) + 40*Math.sin(x/3*pi)) * 2/3;
    ret += (150*Math.sin(x/12*pi) + 300*Math.sin(x*pi/30)) * 2/3;
    return ret;
  };

  self.wgs84togcj02 = function(lon, lat) {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    const pi = Math.PI;
    if (self.outOfChina(lat, lon)) return [lon, lat];

    let dLat = self.transformLat(lon - 105, lat - 35);
    let dLon = self.transformLon(lon - 105, lat - 35);
    const radLat = lat / 180 * pi;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    dLon = (dLon * 180) / (a / sqrtMagic * Math.cos(radLat) * pi);

    return [lon + dLon, lat + dLat];
  };

  /* ---------- 获取当前 Portal ---------- */

  self.getPortal = function() {
    const guid = window.selectedPortal ||
      (window.portalDetail && window.portalDetail.guid);
    if (!guid || !window.portals || !window.portals[guid]) return null;
    return window.portals[guid];
  };

  /* ---------- UI ---------- */

  self.addButton = function() {
    if (document.getElementById('amap-btn')) return;

    const btn = window.jQuery(
      '<div id="amap-btn" ' +
      'style="position:fixed;left:10px;top:65%;z-index:9999;' +
      'width:36px;height:36px;border-radius:50%;' +
      'background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);' +
      'display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;">🧭</div>'
    );

    btn.on('click', function() {
      const p = self.getPortal();
      if (!p || !p._latlng) {
        alert('请先选中一个 Portal');
        return;
      }

      const lat = p._latlng.lat;
      const lon = p._latlng.lng;
      const [glon, glat] = self.wgs84togcj02(lon, lat);
      const name = p.options?.data?.title || 'Portal';

      const url =
        'https://uri.amap.com/marker?position=' +
        glon + ',' + glat +
        '&name=' + encodeURIComponent(name);

      window.open(url, '_blank');
    });

    window.jQuery('body').append(btn);
  };

  self.setup = function() {
    self.addButton();
    console.log('[portal2amap] loaded');
  };

  const setup = function() {
    if (window.iitcLoaded) self.setup();
    else window.addHook('iitcLoaded', self.setup);
  };

  setup.info = plugin_info;
  if (!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  if (window.iitcLoaded) setup();
}

// inject
const script = document.createElement('script');
script.textContent = '(' + wrapper + ')({});';
(document.body || document.head).appendChild(script);
