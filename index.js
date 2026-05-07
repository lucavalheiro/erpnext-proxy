const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;

/* =========================
   ERPNext CONFIG
========================= */

const ERP_HOST = 'erpcoe.frappe.cloud';

const ERP_TOKEN =
  'token 7878766b0045a1b:9d2cbe684250310';

const WAREHOUSE = 'Finished Goods - TD';

const PRICE_LIST = 'Standard Selling';

const COMPANY = 'TDSynnex (Demo)';

/* =========================
   HELPERS
========================= */

function encodePath(path) {
  return path
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/"/g, '%22')
    .replace(/ /g, '%20');
}

function erpGet(path, cb) {
  const safed = encodePath(path);

  https.get(
    {
      hostname: ERP_HOST,
      path: safed,
      headers: {
        Authorization: ERP_TOKEN,
        Accept: 'application/json'
      }
    },
    (r) => {
      let d = '';

      r.on('data', (c) => (d += c));

      r.on('end', () => {
        try {
          cb(null, JSON.parse(d));
        } catch (e) {
          cb(new Error('Parse error: ' + d.slice(0, 300)));
        }
      });
    }
  ).on('error', cb);
}

function erpPost(path, body, cb) {
  const data = JSON.stringify(body);

  const safed = encodePath(path);

  const req = https.request(
    {
      hostname: ERP_HOST,
      path: safed,
      method: 'POST',
      headers: {
        Authorization: ERP_TOKEN,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    },
    (r) => {
      let d = '';

      r.on('data', (c) => (d += c));

      r.on('end', () => {
        try {
          cb(null, JSON.parse(d));
        } catch (e) {
          cb(new Error('Parse error: ' + d.slice(0, 300)));
        }
      });
    }
  );

  req.on('error', cb);

  req.write(data);

  req.end();
}

function parseBody(req, cb) {
  let d = '';

  req.on('data', (c) => (d += c));

  req.on('end', () => {
    try {
      cb(JSON.parse(d));
    } catch (e) {
      cb({});
    }
  });
}

/* =========================
   HTML
========================= */

const HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ERPi Store</title>

<style>

*{
  box-sizing:border-box;
  margin:0;
  padding:0
}

body{
  font-family:Arial,sans-serif;
  background:#f7f8fa;
  min-height:100vh
}

.header{
  background:#0062ff;
  color:#fff;
  padding:16px 24px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  position:sticky;
  top:0;
  z-index:10
}

.header h1{
  font-size:20px;
  font-weight:500
}

.cart-btn{
  background:rgba(255,255,255,.15);
  border:1px solid rgba(255,255,255,.3);
  color:#fff;
  padding:8px 16px;
  border-radius:8px;
  cursor:pointer;
  font-size:14px;
  display:flex;
  align-items:center;
  gap:8px
}

.cart-count{
  background:#fff;
  color:#0062ff;
  border-radius:50%;
  width:22px;
  height:22px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  font-weight:700
}

.main{
  max-width:960px;
  margin:0 auto;
  padding:24px
}

.section-title{
  font-size:16px;
  font-weight:500;
  color:#161616;
  margin-bottom:12px
}

.customer-select{
  width:100%;
  padding:10px 14px;
  border:1px solid #e0e0e0;
  border-radius:8px;
  font-size:14px;
  background:#fff;
  margin-bottom:24px;
  color:#161616
}

.products{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(170px,1fr));
  gap:16px;
  margin-bottom:32px
}

.product-card{
  background:#fff;
  border:1.5px solid #e0e0e0;
  border-radius:12px;
  padding:16px;
  transition:border-color .15s,background .15s
}

.product-card:hover{
  border-color:#0062ff
}

.product-card.selected{
  border:2px solid #0062ff;
  background:#f0f4ff
}

.product-icon{
  font-size:32px;
  margin-bottom:10px
}

.product-name{
  font-size:14px;
  font-weight:500;
  color:#161616;
  margin-bottom:2px
}

.product-sku{
  font-size:11px;
  color:#888;
  margin-bottom:6px
}

.product-price{
  font-size:15px;
  font-weight:700;
  color:#0062ff
}

.product-stock{
  font-size:11px;
  margin-top:3px
}

.stock-ok{
  color:#198038
}

.stock-neg{
  color:#da1e28
}

.qty-control{
  display:flex;
  align-items:center;
  gap:6px;
  margin-top:10px
}

.qty-btn{
  width:28px;
  height:28px;
  border:1px solid #e0e0e0;
  border-radius:6px;
  background:#f4f4f4;
  cursor:pointer;
  font-size:16px;
  line-height:1;
  color:#161616
}

.qty-btn:hover{
  background:#e0e0e0
}

.qty-input{
  width:36px;
  text-align:center;
  border:1px solid #e0e0e0;
  border-radius:6px;
  padding:4px;
  font-size:13px;
  color:#161616
}

.cart-section{
  background:#fff;
  border:1px solid #e0e0e0;
  border-radius:12px;
  padding:20px;
  margin-bottom:20px
}

.cart-item{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:10px 0;
  border-bottom:1px solid #f4f4f4
}

.cart-item:last-child{
  border-bottom:none
}

.cart-total{
  display:flex;
  justify-content:space-between;
  font-size:16px;
  font-weight:700;
  padding-top:14px;
  color:#161616;
  border-top:1.5px solid #e0e0e0;
  margin-top:8px
}

.btn-primary{
  background:#0062ff;
  color:#fff;
  border:none;
  padding:14px 32px;
  border-radius:8px;
  font-size:15px;
  font-weight:500;
  cursor:pointer;
  width:100%;
  margin-top:4px
}

.btn-primary:hover{
  background:#0043ce
}

.btn-primary:disabled{
  background:#c6c6c6;
  cursor:not-allowed
}

.empty-cart{
  color:#888;
  font-size:13px;
  text-align:center;
  padding:16px
}

.badge{
  display:inline-block;
  padding:2px 10px;
  border-radius:20px;
  font-size:11px;
  background:#e6f1fb;
  color:#0c447c;
  margin-left:8px
}

.remove-btn{
  background:none;
  border:none;
  color:#da1e28;
  cursor:pointer;
  font-size:18px;
  padding:0 4px;
  line-height:1
}

.success-box{
  background:#defbe6;
  border:1px solid #a7f0ba;
  border-radius:8px;
  padding:14px 16px;
  color:#198038;
  font-size:14px;
  margin-top:12px
}

.error-box{
  background:#fff1f1;
  border:1px solid #ffd7d9;
  border-radius:8px;
  padding:14px 16px;
  color:#da1e28;
  font-size:14px;
  margin-top:12px
}

.loading{
  color:#0062ff;
  font-size:14px;
  margin-top:12px;
  text-align:center
}

</style>
</head>

<body>

<div class="header">
  <h1>ERPi Store</h1>

  <button class="cart-btn" id="btnCart">
    Carrinho
    <span class="cart-count" id="cartCount">0</span>
  </button>
</div>

<div class="main">

  <p class="section-title">Cliente</p>

  <select class="customer-select" id="customer">
    <option value="">Selecione o cliente...</option>
    <option>Grant Plastics Ltd.</option>
    <option>Palmer Productions Ltd.</option>
    <option>West View Software Ltd.</option>
  </select>

  <p class="section-title">Produtos</p>

  <div class="products" id="products">
    <p style="color:#888;font-size:14px">
      Carregando produtos...
    </p>
  </div>

  <div class="cart-section" id="cartSection">

    <p class="section-title">
      Carrinho
      <span class="badge" id="cartBadge">0 itens</span>
    </p>

    <div id="cartItems">
      <p class="empty-cart">
        Nenhum item adicionado.
      </p>
    </div>

    <div id="cartTotal"
         style="display:none"
         class="cart-total">
      <span>Total</span>
      <span id="totalValue">R$ 0,00</span>
    </div>

  </div>

  <button class="btn-primary"
          id="btnOrder"
          disabled>
    Criar Sales Order no ERPNext
  </button>

  <div id="status"></div>

</div>

<script>

var items = [];
var cart  = {};

document.getElementById("btnCart")
.addEventListener("click", function() {

  document
  .getElementById("cartSection")
  .scrollIntoView({behavior:"smooth"});
});

document
.getElementById("customer")
.addEventListener("change", updateBtn);

document
.getElementById("btnOrder")
.addEventListener("click", criarOrdem);

fetch("/api/items")
.then(function(r){
  return r.json();
})
.then(function(d){

  if(d.error){

    document.getElementById("products").innerHTML =
      "<p style='color:#da1e28;font-size:13px'>Erro: "
      + d.error +
      "</p>";

    return;
  }

  items = d;

  renderProducts();

})
.catch(function(e){

  document.getElementById("products").innerHTML =
    "<p style='color:#da1e28;font-size:13px'>Falha: "
    + e.message +
    "</p>";
});

function fmt(n){

  return "R$ " +
    Number(n).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2
      }
    );
}

function renderProducts(){

  if(!items.length){

    document.getElementById("products").innerHTML =
      "<p style='color:#888'>Nenhum produto.</p>";

    return;
  }

  var h = "";

  items.forEach(function(p){

    var q = cart[p.sku]
      ? cart[p.sku].qty
      : 0;

    var s = q > 0
      ? " selected"
      : "";

    h +=
      "<div class='product-card" + s + "'>" +

      "<div class='product-icon'>" +
      p.icon +
      "</div>" +

      "<div class='product-name'>" +
      p.name +
      "</div>" +

      "<div class='product-sku'>" +
      p.sku +
      "</div>" +

      "<div class='product-price'>" +
      fmt(p.price) +
      "</div>" +

      "<div class='product-stock " +
      (p.stock > 0 ? "stock-ok" : "stock-neg") +
      "'>" +

      (p.stock > 0
        ? "Estoque: " + p.stock
        : "Sem estoque") +

      "</div>" +

      "<div class='qty-control'>" +

      "<button class='qty-btn' data-sku='" +
      p.sku +
      "' data-d='-1'>-</button>" +

      "<input class='qty-input' value='" +
      (q || 0) +
      "' readonly/>" +

      "<button class='qty-btn' data-sku='" +
      p.sku +
      "' data-d='1'>+</button>" +

      "</div>" +

      "</div>";
  });

  var el = document.getElementById("products");

  el.innerHTML = h;

  el.onclick = function(e){

    var b = e.target.closest("[data-sku]");

    if(b){

      changeQty(
        b.getAttribute("data-sku"),
        parseInt(
          b.getAttribute("data-d")
        )
      );
    }
  };
}

function changeQty(sku, delta){

  var item = items.find(function(i){
    return i.sku === sku;
  });

  if(!item) return;

  var cur = cart[sku]
    ? cart[sku].qty
    : 0;

  var nw = Math.max(0, cur + delta);

  if(nw === 0){

    delete cart[sku];

  } else {

    cart[sku] = {
      sku: sku,
      name: item.name,
      price: item.price,
      qty: nw
    };
  }

  renderProducts();

  renderCart();
}

function renderCart(){

  var keys = Object.keys(cart);

  document.getElementById("cartCount")
    .textContent = keys.length;

  document.getElementById("cartBadge")
    .textContent =
      keys.length + " itens";

  if(!keys.length){

    document.getElementById("cartItems")
      .innerHTML =
        "<p class='empty-cart'>Nenhum item adicionado.</p>";

    document.getElementById("cartTotal")
      .style.display = "none";

    updateBtn();

    return;
  }

  var total = 0;

  var h = "";

  keys.forEach(function(k){

    var c = cart[k];

    var sub = c.price * c.qty;

    total += sub;

    h +=
      "<div class='cart-item'>" +

      "<div>" +

      "<div style='font-size:14px;font-weight:500;color:#161616'>" +
      c.name +
      "</div>" +

      "<div style='font-size:12px;color:#888'>" +
      c.qty +
      " x " +
      fmt(c.price) +
      "</div>" +

      "</div>" +

      "<div style='display:flex;align-items:center;gap:10px'>" +

      "<span style='font-weight:500;font-size:14px;color:#161616'>" +
      fmt(sub) +
      "</span>" +

      "<button class='remove-btn' data-remove='" +
      k +
      "'>x</button>" +

      "</div>" +

      "</div>";
  });

  var ci = document.getElementById("cartItems");

  ci.innerHTML = h;

  ci.onclick = function(e){

    var b = e.target.closest("[data-remove]");

    if(b){

      delete cart[
        b.getAttribute("data-remove")
      ];

      renderProducts();

      renderCart();
    }
  };

  document.getElementById("totalValue")
    .textContent = fmt(total);

  document.getElementById("cartTotal")
    .style.display = "flex";

  updateBtn();
}

function updateBtn(){

  document.getElementById("btnOrder")
    .disabled =
      !document.getElementById("customer").value ||
      !Object.keys(cart).length;
}

function criarOrdem(){

  var customer =
    document.getElementById("customer").value;

  if(!customer || !Object.keys(cart).length)
    return;

  document.getElementById("status").innerHTML =
    "<p class='loading'>Criando Sales Order...</p>";

  document.getElementById("btnOrder")
    .disabled = true;

  var payload = {

    customer: customer,

    items: Object.keys(cart).map(function(k){

      return {

        sku: cart[k].sku,
        qty: cart[k].qty,
        price: cart[k].price
      };
    })
  };

  fetch("/order", {

    method: "POST",

    headers: {
      "Content-Type":"application/json"
    },

    body: JSON.stringify(payload)

  })
  .then(function(r){

    return r.json();

  })
  .then(function(d){

    if(d.success){

      document.getElementById("status").innerHTML =
        "<div class='success-box'>Sales Order criado: <strong>"
        + d.order_id +
        "</strong></div>";

      cart = {};

      renderProducts();

      renderCart();

    } else {

      document.getElementById("status").innerHTML =
        "<div class='error-box'>Erro: "
        + d.error +
        "</div>";

      document.getElementById("btnOrder")
        .disabled = false;
    }

  })
  .catch(function(e){

    document.getElementById("status").innerHTML =
      "<div class='error-box'>Falha: "
      + e.message +
      "</div>";

    document.getElementById("btnOrder")
      .disabled = false;
  });
}

</script>

</body>
</html>
`;

/* =========================
   SERVER
========================= */

const server = http.createServer((req, res) => {

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  if(req.method === 'OPTIONS'){

    res.writeHead(200);

    res.end();

    return;
  }

  const url = new URL(
    req.url,
    'http://localhost'
  );

  /* =====================
     HOME
  ===================== */

  if(url.pathname === '/' &&
     req.method === 'GET'){

    res.writeHead(200,{
      'Content-Type':
      'text/html; charset=utf-8'
    });

    res.end(HTML);

    return;
  }

  /* =====================
     ITEMS
  ===================== */

  if(url.pathname === '/api/items' &&
     req.method === 'GET'){

    const icons = {
      SKU001:'👕',
      SKU002:'💻',
      SKU003:'📚',
      SKU004:'📱',
      SKU005:'👟',
      SKU006:'☕',
      SKU007:'📺',
      SKU008:'🎒',
      SKU009:'🎧',
      SKU010:'📷'
    };

    const names = {
      SKU001:'T-shirt',
      SKU002:'Laptop',
      SKU003:'Book',
      SKU004:'Smartphone',
      SKU005:'Sneakers',
      SKU006:'Coffee Mug',
      SKU007:'Television',
      SKU008:'Backpack',
      SKU009:'Headphones',
      SKU010:'Camera'
    };

    const priceUrl =
      '/api/resource/Item Price?fields=["item_code","item_name","price_list_rate"]&filters=[["price_list","=","'
      + PRICE_LIST +
      '"]]&limit_page_length=20';

    erpGet(priceUrl, (err, priceData) => {

      if(err){

        res.writeHead(200,{
          'Content-Type':'application/json'
        });

        res.end(
          JSON.stringify({
            error:'Erro preços: ' + err.message
          })
        );

        return;
      }

      const prices =
        priceData &&
        priceData.data
          ? priceData.data
          : [];

      if(!prices.length){

        res.writeHead(200,{
          'Content-Type':'application/json'
        });

        res.end(
          JSON.stringify({
            error:'Nenhum item encontrado.'
          })
        );

        return;
      }

      const stockUrl =
        '/api/resource/Bin?fields=["item_code","actual_qty"]&filters=[["warehouse","=","'
        + WAREHOUSE +
        '"]]&limit_page_length=50';

      erpGet(stockUrl, (err2, stockData) => {

        const stockMap = {};

        if(!err2 &&
           stockData &&
           stockData.data){

          stockData.data.forEach((s)=>{

            stockMap[s.item_code] =
              s.actual_qty;
          });
        }

        const result = prices.map((p)=>({

          sku: p.item_code,

          name:
            names[p.item_code] ||
            p.item_name ||
            p.item_code,

          price:
            p.price_list_rate || 0,

          stock:
            stockMap[p.item_code] !== undefined
              ? stockMap[p.item_code]
              : 0,

          icon:
            icons[p.item_code] || '📦'
        }));

        res.writeHead(200,{
          'Content-Type':'application/json'
        });

        res.end(JSON.stringify(result));
      });
    });

    return;
  }

  /* =====================
     CREATE ORDER
  ===================== */

  if(url.pathname === '/order' &&
     req.method === 'POST'){

    parseBody(req, (body)=>{

      if(!body.customer ||
         !body.items ||
         !body.items.length){

        res.writeHead(400,{
          'Content-Type':'application/json'
        });

        res.end(
          JSON.stringify({
            success:false,
            error:'customer e items obrigatórios.'
          })
        );

        return;
      }

      const deliveryDate =
        new Date(
          Date.now() + 7 * 86400000
        )
        .toISOString()
        .split('T')[0];

      const order = {

        doctype:'Sales Order',

        company: COMPANY,

        customer: body.customer,

        transaction_date:
          new Date()
          .toISOString()
          .split('T')[0],

        delivery_date: deliveryDate,

        selling_price_list:
          PRICE_LIST,

        items:
          body.items.map((i)=>({

            item_code:i.sku,

            qty:i.qty,

            rate:i.price,

            delivery_date:deliveryDate,

            warehouse:WAREHOUSE
          }))
      };

      console.log(
        '[/order]',
        JSON.stringify(order)
      );

      erpPost(
        '/api/resource/Sales Order',
        order,
        (err, data)=>{

          if(err){

            res.writeHead(500,{
              'Content-Type':'application/json'
            });

            res.end(
              JSON.stringify({
                success:false,
                error:err.message
              })
            );

            return;
          }

          console.log(
            '[/order] resp:',
            JSON.stringify(data).slice(0,300)
          );

          if(data.data &&
             data.data.name){

            res.writeHead(200,{
              'Content-Type':'application/json'
            });

            res.end(
              JSON.stringify({
                success:true,
                order_id:data.data.name
              })
            );

          } else {

            const errMsg =
              data.exception ||
              data.message ||
              data._server_messages ||
              JSON.stringify(data);

            res.writeHead(200,{
              'Content-Type':'application/json'
            });

            res.end(
              JSON.stringify({
                success:false,
                error:errMsg
              })
            );
          }
        }
      );
    });

    return;
  }

  /* =====================
     404
  ===================== */

  res.writeHead(404);

  res.end('Not found');
});

server.listen(PORT, ()=>{

  console.log(
    'ERPi Store porta ' + PORT
  );

  console.log(
    'ERP Host: ' + ERP_HOST
  );
});
