import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline, Popup, Pane } from 'react-leaflet'
import L from 'leaflet'
import { v4 as uuidv4 } from 'uuid'

import 'leaflet/dist/leaflet.css'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const SPEED_OF_LIGHT = 3e8 // m/s

function haversineDist(a, b) {
  const R = 6371000
  const toRad = (x) => x * Math.PI / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sin_dLat = Math.sin(dLat/2)
  const sin_dLon = Math.sin(dLon/2)
  const aCalc = sin_dLat*sin_dLat + sin_dLon*sin_dLon * Math.cos(lat1)*Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1-aCalc))
  return R * c
}

function MapClickHandler({ onMapClick }){
  useMapEvents({ click(e){ onMapClick(e.latlng) } })
  return null
}

export default function App(){
  const [towers, setTowers] = useState([])
  const [selectedTowerId, setSelectedTowerId] = useState(null)
  const [linkTemp, setLinkTemp] = useState([])
  const [links, setLinks] = useState([])
  const [activeLinkId, setActiveLinkId] = useState(null)
  const mapRef = useRef()

  useEffect(()=>{
    setTowers([{
      id: uuidv4(), latlng:{lat: 28.6139, lng:77.2090}, freqGHz: 5.0, name:'Tower A (Delhi)'
    }])
  },[])

  async function handleMapClick(latlng){
    const id = uuidv4()
    const newTower = { id, latlng, freqGHz: 5.0, name: 'Tower ' + (towers.length + 1) }
    setTowers(t=>[...t, newTower])
  }

  function updateTower(id, patch){ setTowers(ts=>ts.map(t=> t.id===id ? {...t,...patch} : t)) }

  function removeTower(id){
    setTowers(ts=>ts.filter(t=>t.id!==id))
    setLinks(ls=>ls.filter(l=> l.aId!==id && l.bId!==id))
    setLinkTemp([])
  }

  function handleTowerClick(tower, e){
    e.originalEvent && e.originalEvent.stopPropagation()
    if(linkTemp.length === 0){ setLinkTemp([tower.id]); setSelectedTowerId(tower.id); }
    else if(linkTemp.length === 1){
      if(linkTemp[0] === tower.id){ setLinkTemp([]); setSelectedTowerId(null); return }
      const t1 = towers.find(x=>x.id===linkTemp[0])
      const t2 = tower
      if(Math.abs(t1.freqGHz - t2.freqGHz) > 1e-6){ alert('Cannot link towers with different frequencies.') ; setLinkTemp([]); setSelectedTowerId(null); return }
      const newLink = { id: uuidv4(), aId: t1.id, bId: t2.id, freqGHz: t1.freqGHz }
      setLinks(ls=>[...ls, newLink])
      setLinkTemp([]); setSelectedTowerId(null)
    }
  }
  

  function removeLink(id){ setLinks(ls=>ls.filter(l=>l.id!==id)); if(activeLinkId===id) setActiveLinkId(null) }

  function computeFresnel(link){
    const a = towers.find(t=>t.id===link.aId)
    const b = towers.find(t=>t.id===link.bId)
    if(!a||!b) return null
    const d = haversineDist(a.latlng, b.latlng)
    const fHz = link.freqGHz * 1e9
    const lambda = SPEED_OF_LIGHT / fHz
    const r_mid = 0.5 * Math.sqrt(lambda * d)
    const latC = (a.latlng.lat + b.latlng.lat)/2
    const lngC = (a.latlng.lng + b.latlng.lng)/2
    const angle = Math.atan2(b.latlng.lat - a.latlng.lat, b.latlng.lng - a.latlng.lng) * 180/Math.PI
    return { center: {lat: latC, lng: lngC}, length: d, r_mid, angle }
  }

  function LinkSVG({link, map}){
    if(!map) return null
    const fres = computeFresnel(link)
    if(!fres) return null
    const a = towers.find(t=>t.id===link.aId)
    const b = towers.find(t=>t.id===link.bId)
    const pA = map.latLngToLayerPoint([a.latlng.lat, a.latlng.lng])
    const pB = map.latLngToLayerPoint([b.latlng.lat, b.latlng.lng])
    const cx = (pA.x + pB.x)/2
    const cy = (pA.y + pB.y)/2
    const rx = Math.max(5, Math.hypot(pB.x - pA.x, pB.y - pA.y)/2)
    const metersPerPixel = fres.length / (2*rx)
    const ry_pixels = Math.max(8, fres.r_mid / metersPerPixel)
    const rotation = Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180/Math.PI
    return (
      <svg style={{position:'absolute', left:0, top:0, pointerEvents:'none', width:'100%', height:'100%'}}>
        <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry_pixels}  fill="rgba(255,0,0,0.15)" stroke="rgba(255,0,0,0.8)" />
        </g>
      </svg>
    )
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="brand text-xl font-semibold text-white-400 mb-2">RF Link Planner — React + Leaflet</div>
        <div className="info text-sm text-gray-400 mb-3">Click map to add towers. Click a tower, then another with same frequency to make a link.</div>
        <div className="controls">
          <button className="btn" onClick={()=>{ setTowers([]); setLinks([]); setActiveLinkId(null) }}>Clear All</button>
          <button className="btn" onClick={()=>{ alert('Tip: Click a tower to start linking; click another to finish (frequencies must match)') }}>Help</button>
        </div>
        <div className="tower-list">
          {towers.map(t=> (
            <div key={t.id} className="tower-item">
              <div>
                <div style={{fontWeight:700}}>{t.name}</div>
                <div className="info">{t.latlng.lat.toFixed(4)}, {t.latlng.lng.toFixed(4)}</div>
                <div style={{marginTop:6}}>
                  <label className="info">Freq (GHz): </label>
                  <input type="number" step="0.1" value={t.freqGHz} onChange={(e)=> updateTower(t.id, {freqGHz: parseFloat(e.target.value) || 0})} style={{width:80, marginLeft:6}} />
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <button className="btn" onClick={()=>{ setLinkTemp([t.id]); setSelectedTowerId(t.id) }}>Select</button>
                <button className="btn danger" onClick={()=> removeTower(t.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{margin:'8px 0'}}>Links</h4>
          {links.map(l=>{
            const a = towers.find(t=>t.id===l.aId)
            const b = towers.find(t=>t.id===l.bId)
            const dist = a && b ? (haversineDist(a.latlng,b.latlng)/1000).toFixed(2)+' km' : '—'
            return (
              <div key={l.id} className='links-list  flex justify-between items-center p-4 sm:p-3 md:p-4 bg-white/5 rounded-md mb-2 '>
                <div>
                  <div style={{fontWeight:700}}>{a?.name} ↔ {b?.name}</div>
                  <div className="info">{l.freqGHz} GHz · {dist}</div>
                </div>
                <div style={{display:'flex', gap:6, marginTop:4}}>
                  <button
                    className={`btn ${activeLinkId === l.id ? 'active' : ''}`}
                    onClick={() => setActiveLinkId(activeLinkId === l.id ? null : l.id)}
                  >
                    {activeLinkId === l.id ? 'Showing' : 'Show Fresnel'}
                  </button>
                  <button className="btn danger" onClick={()=> removeLink(l.id)}>Del</button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{fontSize:12, color:'#9fb0d6', marginTop:12}}>Notes: Fresnel drawn as 2D ellipse (simplified). Elevation sampling via Open-Elevation attempted on link click.</div>
      </div>

      <div className="map-wrap">
        <MapContainer center={[20.5937,78.9629]} zoom={5} whenCreated={m=>mapRef.current=m} style={{height:'100vh'}}>
          
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={handleMapClick} />

          <Pane name="links" style={{zIndex: 400}}>
            {links.map(l=>{
              const a = towers.find(t=>t.id===l.aId)
              const b = towers.find(t=>t.id===l.bId)
              if(!a||!b) return null
              return (
                <Polyline key={l.id} positions={[[a.latlng.lat,a.latlng.lng],[b.latlng.lat,b.latlng.lng]]} eventHandlers={{ click: ()=> setActiveLinkId(l.id) }} pathOptions={{color: l.id===activeLinkId ? '#ff0000' : '#2dd4bf', weight:4, opacity:0.9}} />
              )
            })}
          </Pane>

          {towers.map(t=> (
            <Marker key={t.id} position={[t.latlng.lat, t.latlng.lng]} eventHandlers={{ click: (e)=> handleTowerClick(t,e) }}>
              <Popup>
                <div style={{minWidth:180}}>
                  <div style={{fontWeight:700}}>{t.name}</div>
                  <div className="info">{t.latlng.lat.toFixed(5)}, {t.latlng.lng.toFixed(5)}</div>
                  <div style={{marginTop:8}}>
                    <label>Freq (GHz): </label>
                    <input type="number" step="0.1" value={t.freqGHz} onChange={(e)=> updateTower(t.id, {freqGHz: parseFloat(e.target.value) || 0})} style={{width:90, marginLeft:6}} />
                  </div>
                  <div style={{marginTop:8, display:'flex', gap:8}}>
                    <button className="btn" onClick={()=> setLinkTemp([t.id])}>Start Link</button>
                    <button className="btn danger" onClick={()=> removeTower(t.id)}>Delete</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
        <div style={{position:'absolute', left:0, top:0, right:0, bottom:0, pointerEvents:'none'}}>
          {activeLinkId && mapRef.current ? <LinkSVG link={links.find(l=>l.id===activeLinkId)} map={mapRef.current} /> : null}
        </div>
      </div>
    </div>
  )
}
