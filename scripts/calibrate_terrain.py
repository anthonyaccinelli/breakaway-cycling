#!/usr/bin/env python3
"""Calibrate terrain profiles from licensed GeoJSON cycling lines + USGS 3DEP DEM.

Install: pip install rasterio numpy
Run: python scripts/calibrate_terrain.py --roads data/roads.geojson --dem data/3dep.tif --out public/terrain-calibration.json
Roads: OSM-derived GeoJSON LineString/MultiLineString (ODbL; preserve attribution).
DEM: USGS 3DEP GeoTIFF (public domain), covering the same area.
No remote scraping or user GPS traces.
"""
import argparse, json, math, random, statistics
from collections import defaultdict
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform

def dist(a,b):
    la,lo=a; lb,ln=b
    dy=math.radians(lb-la); dx=math.radians(ln-lo)
    h=math.sin(dy/2)**2+math.cos(math.radians(la))*math.cos(math.radians(lb))*math.sin(dx/2)**2
    return 12742000*math.asin(min(1,math.sqrt(h)))

def interpolate(line, step=30):
    coords=[(float(p[1]),float(p[0])) for p in line]
    if len(coords)<2:return []
    lengths=[dist(a,b) for a,b in zip(coords,coords[1:])]
    total=sum(lengths)
    if total<400:return []
    positions=np.arange(0,total,step)
    result=[]; i=0; run=0
    for x in positions:
        while i<len(lengths)-1 and run+lengths[i]<x:
            run+=lengths[i];i+=1
        t=max(0,min(1,(x-run)/max(lengths[i],.001)))
        result.append((coords[i][0]+t*(coords[i+1][0]-coords[i][0]),coords[i][1]+t*(coords[i+1][1]-coords[i][1])))
    return result

def lines(obj):
    for feature in obj.get('features',[]):
        geom=feature.get('geometry') or {}
        typ=geom.get('type')
        if typ=='LineString':yield geom['coordinates']
        if typ=='MultiLineString':yield from geom['coordinates']

def profile(line,dem):
    sampled=interpolate(line)
    if len(sampled)<14:return None
    xs,ys=transform('EPSG:4326',dem.crs,[p[1] for p in sampled],[p[0] for p in sampled])
    z=np.array([v[0] for v in dem.sample(zip(xs,ys))],dtype=float)
    if np.any(~np.isfinite(z)) or (dem.nodata is not None and np.any(z==dem.nodata)):return None
    # Median filtering suppresses isolated raster artifacts without flattening short ramps.
    clean=np.array([np.median(z[max(0,i-1):i+2]) for i in range(len(z))])
    grade=np.clip(np.diff(clean)/30*100,-20,20)
    return grade

def summarize(grades):
    g=np.asarray(grades)
    if len(g)<10:return None
    # Track coherent climb/descent runs; short grade sign changes count as false flats.
    signs=np.where(g>1,1,np.where(g< -1,-1,0))
    runs=[]; prev=int(signs[0]); count=1
    for sign in signs[1:]:
        if sign==prev:count+=1
        else:runs.append((prev,count*30));prev=int(sign);count=1
    runs.append((prev,count*30))
    return {'mean_abs_grade':float(np.mean(np.abs(g))),
            'p90_abs_grade':float(np.percentile(np.abs(g),90)),
            'grade_change_p75':float(np.percentile(np.abs(np.diff(g)),75)),
            'climb_length_p50':float(np.median([n for s,n in runs if s==1] or [0])),
            'descent_length_p50':float(np.median([n for s,n in runs if s==-1] or [0])),
            'false_flat_fraction':float(np.mean(signs==0)),
            'distance_m':len(g)*30}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--roads',required=True);ap.add_argument('--dem',required=True)
    ap.add_argument('--out',default='public/terrain-calibration.json')
    ap.add_argument('--samples',type=int,default=1000);ap.add_argument('--seed',type=int,default=4821)
    args=ap.parse_args()
    roads=list(lines(json.loads(Path(args.roads).read_text())))
    random.Random(args.seed).shuffle(roads)
    records=[]
    with rasterio.open(args.dem) as dem:
        for line in roads:
            p=profile(line,dem)
            if p is None:continue
            rec=summarize(p)
            if rec:records.append(rec)
            if len(records)>=args.samples:break
    if not records:raise SystemExit('No valid overlapping road/DEM samples; verify coverage and coordinate systems.')
    stats={k:round(float(statistics.median(r[k] for r in records)),4) for k in records[0] if k!='distance_m'}
    result={'schema':1,'source':'OSM-derived roads + USGS 3DEP DEM','license':'OSM ODbL 1.0; USGS public domain','sample_count':len(records),'seed':args.seed,'sample_spacing_m':30,'statistics':stats}
    Path(args.out).parent.mkdir(parents=True,exist_ok=True)
    Path(args.out).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
    if len(records)<args.samples:print('WARNING: fewer than requested valid samples; do not label as 1000-route calibrated.')

if __name__=='__main__':main()
