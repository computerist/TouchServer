import tornado.websocket as websocket

import tornado.ioloop
import tornado.web
import os
import drive
import json
import threading
import time

settings = {'debug': True, 
            'static_path': os.path.join(os.getcwd(), 'static')}

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class DriveWebSocket(websocket.WebSocketHandler):
    def open(self):
        self.md25 = drive.md25(mode=0)
        print "WebSocket opened"
        #TODO Clear this out; it's horrible code
        class StatusReporter(threading.Thread):
            def __init__(self, ws):
                threading.Thread.__init__(self)
                self.ws = ws
                
            def run(self):
                self.running = True
                while(self.running):
                    self.ws.write_message(json.dumps({'battery':self.ws.md25.battery()}));
                    time.sleep(1)
            
            def stop(self):
                self.running = False
                    
        self.reporter = StatusReporter(self);
        self.reporter.setDaemon(True)
        self.reporter.start()

    def on_message(self, message):
        print(u"You said: " + message)
        try:
            data = json.loads(message)
            if data['type'] == 'touch':
                if self.md25.mode == 0:
                    if data['control']==0:
                        self.md25.drive(motor0=data['y'])
                    if data['control']==1:
                        self.md25.drive(motor1=data['y'])
                else:
                    if data['control']==0:
                        self.md25.drive(speed=data['y'], turn=data['x'])
            if data['type'] == 'mode':
                if data['mode'] == 'multi touch':
                    print 'MULTI!!!!'
                    self.md25 = drive.md25(mode=0)
                else:
                    print 'SiNGLE!!!'
                    self.md25 = drive.md25(mode=2)
            if data['type'] == 'stop':
                self.md25.stop()
        except ValueError:
            pass

    def on_close(self):
        print "WebSocket closed"
        self.reporter.stop();

application = tornado.web.Application([
    #(r"/", MainHandler),
    (r"/", MainHandler),
    (r"/drive_websocket", DriveWebSocket),
    (r'/static/(.*)', tornado.web.StaticFileHandler, {"path": "./static"}),
])
        
if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()