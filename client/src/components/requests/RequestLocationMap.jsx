import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import api, { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Icon from '../Icon';

function FitMapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, points]);

  return null;
}

function geolocationError(error) {
  if (error.code === 1) return 'Allow location access in your browser to share your live location.';
  if (error.code === 2) return 'Your current location could not be determined. Try again outdoors.';
  if (error.code === 3) return 'Getting your location took too long. Please try again.';
  return 'Your location could not be shared. Check your browser location settings.';
}

export default function RequestLocationMap({ request }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const isTechnician = user.role === 'technician';
  const canTrack = ['accepted', 'on_the_way', 'arrived'].includes(request.status);
  const locationKey = useMemo(() => ['requests', request.id, 'location'], [request.id]);
  const watchId = useRef(null);
  const lastUpdateAt = useRef(0);
  const updatePending = useRef(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [locationError, setLocationError] = useState('');

  const locationQuery = useQuery({
    queryKey: locationKey,
    queryFn: () =>
      api.get(`/requests/${request.id}/location`).then((response) => response.data.data.location),
    enabled: canTrack,
    refetchInterval: request.status === 'on_the_way' ? 30000 : false,
  });
  const share = locationQuery.data;
  const shareLatitude = share?.lat;
  const shareLongitude = share?.lng;
  const customerPosition = useMemo(
    () => [Number(request.lat), Number(request.lng)],
    [request.lat, request.lng]
  );
  const technicianPosition = useMemo(
    () =>
      shareLatitude !== undefined && shareLongitude !== undefined
        ? [Number(shareLatitude), Number(shareLongitude)]
        : null,
    [shareLatitude, shareLongitude]
  );
  const mapPoints = useMemo(
    () => (technicianPosition ? [customerPosition, technicianPosition] : [customerPosition]),
    [customerPosition, technicianPosition]
  );

  useEffect(() => {
    if (!socket) return undefined;
    function onLocation(payload) {
      if (Number(payload.requestId) !== Number(request.id)) return;
      queryClient.setQueryData(locationKey, payload.location);
    }
    socket.on('request:location', onLocation);
    return () => socket.off('request:location', onLocation);
  }, [socket, request.id, queryClient, locationKey]);

  useEffect(() => {
    if (request.status !== 'on_the_way' && share) {
      queryClient.setQueryData(locationKey, null);
    }
  }, [request.status, share, queryClient, locationKey]);

  useEffect(() => {
    if (!isTechnician || request.status !== 'on_the_way' || !share?.id) return undefined;
    if (!navigator.geolocation) {
      setLocationError('This browser does not support live location sharing.');
      return undefined;
    }
    setLocationError('');

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastUpdateAt.current < 10000 || updatePending.current) return;
        lastUpdateAt.current = now;
        updatePending.current = true;
        try {
          const response = await api.patch(`/requests/${request.id}/location`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          queryClient.setQueryData(locationKey, response.data.data.location);
        } catch (error) {
          setLocationError(apiErrorMessage(error, 'Your live location could not be updated.'));
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        } finally {
          updatePending.current = false;
        }
      },
      (error) => {
        setLocationError(geolocationError(error));
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [isTechnician, request.status, request.id, share?.id, queryClient, locationKey]);

  async function startSharing() {
    if (!navigator.geolocation) {
      setLocationError('This browser does not support live location sharing.');
      return;
    }
    setStarting(true);
    setLocationError('');
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        })
      );
      const response = await api.post(`/requests/${request.id}/location`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      lastUpdateAt.current = Date.now();
      queryClient.setQueryData(locationKey, response.data.data.location);
    } catch (error) {
      setLocationError(
        typeof error?.code === 'number'
          ? geolocationError(error)
          : apiErrorMessage(error, 'Live location sharing could not start.')
      );
    } finally {
      setStarting(false);
    }
  }

  async function stopSharing() {
    setStopping(true);
    setLocationError('');
    try {
      await api.delete(`/requests/${request.id}/location`);
      queryClient.setQueryData(locationKey, null);
    } catch (error) {
      setLocationError(apiErrorMessage(error, 'Live location sharing could not stop.'));
    } finally {
      setStopping(false);
    }
  }

  if (!canTrack) return null;
  if (!Number.isFinite(customerPosition[0]) || !Number.isFinite(customerPosition[1])) return null;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Icon name="map" className="h-5 w-5 text-brand-700" />
            Live location
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {share
              ? "The map shows the customer's pin and the technician's latest shared position."
              : "The customer's service address is pinned. The technician can share their live position while on the way."}
          </p>
        </div>
        {isTechnician &&
          request.status === 'on_the_way' &&
          (share ? (
            <button type="button" className="btn-danger btn-sm" onClick={stopSharing} disabled={stopping}>
              <Icon name="x" className="h-4 w-4" />
              {stopping ? 'Stopping...' : 'Stop sharing'}
            </button>
          ) : (
            <button type="button" className="btn-primary btn-sm" onClick={startSharing} disabled={starting}>
              <Icon name="locate" className="h-4 w-4" />
              {starting ? 'Getting location...' : 'Share my location'}
            </button>
          ))}
      </div>

      {locationError && (
        <p role="alert" className="mx-5 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-6">
          {locationError}
        </p>
      )}
      {locationQuery.isError && !locationError && (
        <p role="alert" className="mx-5 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-6">
          {apiErrorMessage(locationQuery.error, 'Location information could not be loaded.')}
        </p>
      )}

      <div className="h-72 w-full sm:h-96">
        <MapContainer
          center={customerPosition}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapBounds points={mapPoints} />
          <CircleMarker
            center={customerPosition}
            radius={9}
            pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.9 }}
          >
            <Popup>Customer service location</Popup>
          </CircleMarker>
          {technicianPosition && (
            <CircleMarker
              center={technicianPosition}
              radius={9}
              pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.95 }}
            >
              <Popup>Technician's latest location</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 text-xs text-slate-600 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          Customer location
        </span>
        {share && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Technician {share.updatedAt ? `· updated ${new Date(share.updatedAt).toLocaleTimeString()}` : ''}
          </span>
        )}
        <span className="ml-auto text-slate-400">
          Keep this page open while sharing. Sharing ends when the job status changes or after 4 hours.
        </span>
      </div>
    </section>
  );
}
