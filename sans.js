
const Closeable = function(){}
const Listenable = function(){}
const Initialable = function(){}

Closeable.prototype.close = function(){
    throw new Error("ioException");
}

Listenable.prototype.listen = function(){

}

Initialable.prototype.init = function(){

}

const Http = function(port,limit){
    Closeable.call(this);
    Listenable.call(this);
    Initialable.call(this);

    this.server = null;
    this.executors = null;
    this.thread = null;
    
    this.urls = [];
    
    this.port = port||null;
    this.status = Http.status.waiting;
}

Http.prototype.serverList = [];

Http.prototype.init = function(port){
    this.checkIsWaiting();
    this.setPort(port||this.port);
    
    this.serverList.push(this);
    this.server = new java.net.ServerSocket(this.port);
    this.executors = this.executors || java.util.concurrent.Executors.newFixedThreadPool(4);
    this.setStatus(Http.status.ready);
}

Http.prototype.listen = function(port){
    
    this.checkIsWaiting();

    this.init(port);
    
    const ctx = this;

    this.thread = new java.lang.Thread({run:function(){
            while(true){
                let sc , req, res ,run;
                try{java.lang.Thread.sleep(10)
                    sc = ctx.server.accept();
        
                    req = new Http.Request(sc);
                    res = new Http.Response(sc);
        Log.d(1)
                    res.setHeader(req.headerList);
          Log.d(987)
                    run = new java.lang.Runnable({run:function(){
          Log.d(ctx.urls)
                        for(let a=0,b=ctx.urls.length;a<b;a++){
        
Log.d(req.getUrlPath())
                            if(ctx.urls[a].checkUrlString(new String(req.getUrlPath()))&&new String(req.getMethod().value) == ctx.urls[a].getMethod()){
                                ctx.urls[a].call(req,res);
Log.d(1197)
                                break;
                            }
        
                        }
        
                    }});
                    ctx.executors.submit(run);
                    
                }catch(e){
for(let a in e)Log.d(e[a])
                }
                }}});
    
    this.thread.start();

    this.setStatus(Http.status.running);
}


Http.prototype.checkIsWaiting = function(){
    if(this.status!=Http.status.waiting)throw new Error("server status is not 'Wait'");
}

Http.prototype.setLimit = function(l){
    this.checkIsWaiting();
    this.limit = l;
}

Http.prototype.setPort = function(port){
    if(port == null&&port > 0)throw new Error("value port should be Number (x>0)");
    this.checkIsWaiting();
    this.port = port;
}

Http.prototype.setStatus = function(st){
    this.status = st;
}

Http.prototype.addUrl = function(regexp, callback ,method){
    if(regexp.constructor == String)regexp = new RegExp(regexp);
    this.urls.push(new Url(regexp,callback,method));
}

Http.prototype.setExcutors = function(executors){
    if(executors == null)throw new Error("value executors should be java.util.concurrent.ExecuteService");
    if(this.executors != null)this.executors.shutdownNow();
    this.executors = executors;
}

Http.prototype.close = function(){
    this.thread.interrupt();
    this.executors.shutdownNow();
    this.server.close();
}

Http.prototype.get = function(regexp,callback){
    this.addUrl(regexp,callback,"GET")
}

Http.prototype.post = function(regexp,callback){
    this.addUrl(regexp,callback,"POST")
}

Http.status = Object.freeze({
    error:-1,
    waiting:0,
    ready:1,
    running:2,
    stop:3
});

Http.Request = function(sc){
    Initialable.call(this);

    this.sc = sc;

    this.in = sc.getInputStream();

    this.read = new java.io.InputStreamReader(this.in);
    this.reader = new java.io.BufferedReader(this.read);

    this.headerList = new HeaderList();

    this.init();
}

Http.Request.prototype.init = function(){
Log.d(this.reader)
    let request = new String(this.reader.readLine()).split(" ");
Log.d(request)
    this.headerList.addHeader(new Header("method",request[0]));
    
    this.headerList.addHeader(new Header("urlPath",request[1]));

    this.headerList.addHeader(new Header("version",request[2]));

    request = null;

    while(this.reader.ready()){
        this.headerList.addHeader(new Header(this.reader.readLine()));
    }
}

Http.Request.prototype.getHeader =function(key){
    return this.headerList.getHeader(key);
}

Http.Request.prototype.getMethod = function(){
    return this.getHeader("method");
}


Http.Request.prototype.getUrlPath = function(){
    return this.getHeader("urlPath");
}

Http.Response = function(sc){
    Closeable.call(this);
    
    this.sc = sc;
    this.out = sc.getOutputStream();
    this.write = new java.io.OutputStreamWriter(this.out);
    this.writer = new java.io.PrintWriter(new java.io.BufferedWriter(this.write));

    this.headers = null;

    this.buffer = [];
}

Http.Response.prototype.setCookie = function(str){
    this.headers.addHeader(new Cookie(str));
}

Http.Response.prototype.setHeader = function(h){
    this.headers = h;
}

Http.Response.prototype.send = function(str){
    this.buffer.push(str);
}

Http.Response.prototype.end = function(){
    if(!this.headers.getHeader("Content-Length"))
    this.headers.addHeader("Content-Length",this.buffer.join("").length);
Log.d("♡")
    this.writer.println("HTTP/1.1 200 OK");
Log.d(this.headers.toString())
    this.writer.println(this.headers.toString());
    this.writer.println(this.buffer.join(""));
    this.writer.flush();

    this.close();
}

Http.Response.prototype.close = function(){
    this.writer.close();
    this.write.close();
    this.out.close();
    this.sc.close(); 
    this.headers = null;
    this.buffer = null;
}

const Url = function(regexp,callback,method){
    this.regexp = regexp || null;
    this.method = method || "GET";
    this.callback = callback || function(req,res){};
}

Url.prototype.checkUrlString = function(Str){
    return this.regexp.test(Str);
}

Url.prototype.getMethod = function(){
    return this.method;
}

Url.prototype.call = function(req,res){
    this.callback(req,res);
}

const Header = function(a,b){
    if(!b){
        if(!a){
            this.key = null;
            this.value = null; 
            return;
        }
        this.key = a.split(":")[0];
        this.value = a.split(":")[1];
        return;
    }
    this.key = a;
    this.value = b;
}

Header.prototype.setKey = function(key){
    this.key = key;
}

Header.prototype.setValue = function(str){
    this.value = str;
}

Header.prototype.toString = function(){
    return [this.key,this.value].join(":");
}

const Cookie = function(str){
    Header.call(this);
    this.setKey("Set-Cookie");
    this.setValue(str||"");
}

const HeaderList = function(headerList){
    this.list = headerList||[];
}

HeaderList.prototype.getHeader = function(key){
    const temp = [];
    for(let a=0,b=this.list.length;a<b;a++){
        if(this.list[a].key == key)temp.push(this.list[a]);
    }
    if(temp.length == 0)return null;
    return temp.length == 1?temp[0]:temp;
}

HeaderList.prototype.addHeader = function(a,b){
    return this.list.push(b==null?a:new Header(a,b));
}

HeaderList.prototype.toString = function(){
    const buffer = [];
    for(let a=0,b=this.list.length;a<b;a++){
        buffer[a] = this.list[a].toString();
    }
    return [buffer.join("\r\n"),"\r\n"].join("");
}


const test = new Http();
