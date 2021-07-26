import random
import io
import base64

from Config import DISTINCT_COLOR_LIST

def GetColor(color):
    if color < len(DISTINCT_COLOR_LIST):
        return tuple(int(DISTINCT_COLOR_LIST[color][i+1:i+3], 16) for i in (0, 2, 4))
    
    else:
        return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

def pil2datauri(img):
    #converts PIL image to datauri
    data = io.BytesIO()
    img.save(data, "PNG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:img/png;base64,' + data64.decode('utf-8')