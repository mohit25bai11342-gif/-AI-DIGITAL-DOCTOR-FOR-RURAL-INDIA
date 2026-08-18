import math
import requests


OVERPASS_SERVERS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter"
]


def calculate_distance(lat1, lon1, lat2, lon2):

    earth_radius = 6371

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius * c


def get_coordinates(element):

    if "lat" in element and "lon" in element:
        return element["lat"], element["lon"]

    center = element.get("center", {})

    if "lat" in center and "lon" in center:
        return center["lat"], center["lon"]

    return None, None


def get_address(tags):

    parts = [
        tags.get("addr:housenumber"),
        tags.get("addr:street"),
        tags.get("addr:suburb"),
        tags.get("addr:city"),
        tags.get("addr:district"),
        tags.get("addr:state"),
        tags.get("addr:postcode")
    ]

    parts = [str(x) for x in parts if x]

    return ", ".join(parts) if parts else "Address not available"


def get_phone(tags):

    return (
        tags.get("phone")
        or tags.get("contact:phone")
        or "Phone not available"
    )


def find_hospitals(latitude, longitude):

    latitude = float(latitude)
    longitude = float(longitude)

    radius = 30000

    query = f"""
    [out:json][timeout:25];

    (
        nwr["amenity"="hospital"](around:{radius},{latitude},{longitude});
        nwr["healthcare"="hospital"](around:{radius},{latitude},{longitude});
        nwr["amenity"="clinic"](around:{radius},{latitude},{longitude});
        nwr["healthcare"="clinic"](around:{radius},{latitude},{longitude});
        nwr["healthcare"="centre"](around:{radius},{latitude},{longitude});
    );

    out center tags;
    """

    for server in OVERPASS_SERVERS:

        try:

            print("Trying hospital server:", server)

            response = requests.post(
                server,
                data=query,
                timeout=35,
                headers={
                    "User-Agent": "AI-Digital-Doctor/1.0"
                }
            )

            response.raise_for_status()

            data = response.json()

            hospitals = []
            seen = set()

            for element in data.get("elements", []):

                tags = element.get("tags", {})

                name = (
                    tags.get("name")
                    or tags.get("official_name")
                )

                if not name:
                    continue

                if "veterinary" in name.lower():
                    continue

                lat, lon = get_coordinates(element)

                if lat is None:
                    continue

                distance = calculate_distance(
                    latitude,
                    longitude,
                    lat,
                    lon
                )

                key = (
                    name.lower(),
                    round(float(lat), 5),
                    round(float(lon), 5)
                )

                if key in seen:
                    continue

                seen.add(key)

                maps_url = (
                    "https://www.google.com/maps/dir/?api=1"
                    f"&destination={lat},{lon}"
                )

                hospitals.append({
                    "name": name,
                    "type": (
                        tags.get("amenity")
                        or tags.get("healthcare")
                        or "Hospital"
                    ),
                    "address": get_address(tags),
                    "phone": get_phone(tags),
                    "latitude": lat,
                    "longitude": lon,
                    "distance": round(distance, 2),
                    "maps_url": maps_url
                })

            hospitals.sort(
                key=lambda x: x["distance"]
            )

            print(
                "Hospitals found:",
                len(hospitals)
            )

            return hospitals[:30]

        except requests.exceptions.Timeout:

            print(
                "Hospital server timed out:",
                server
            )

        except requests.exceptions.RequestException as error:

            print(
                "Hospital server error:",
                error
            )

        except Exception as error:

            print(
                "Unexpected hospital error:",
                error
            )

    return []