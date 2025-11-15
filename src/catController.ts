

export const builtInCats = [
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
   "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
   "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExazJwYzRqbmlhZTl2N3RwN3Z0NHZ3eGNjb3ZpaXl0OXJwZXp4Y240bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/q1MeAPDDMb43K/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzUzMjM4d2VsOGp2b3Z1dHVyc2ZiZjBmdXdrYXN1cDRtZm94b3piOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbnUQpnihPSIgIXuZv/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTBnMWI0aWxqc2RtYWlxdTFrMTY1MTFsZGVqY2hpc3RzN2lzb3M1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/v6aOjy0Qo1fIA/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTQ0bGZnYnMycWMwdjBub212OGt1czB5YmdwM3h4bHZ1dTYza3V0cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1iu8uG2cjYFZS6wTxv/giphy.gif"
];


interface CatPicture
{
	id: string;
	url: string;
	width: number;
	height: number;
}

export async function getCats(apiKey: string) {
	const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  });
	
	const requestOptions = {
		method: "GET",
		headers: headers,
	};

	const params = new URLSearchParams(); 
	params.append("size", "med");
	params.append("mime_types", "jpg");
	params.append("format", "json");
	params.append("order", "RANDOM");
	if (apiKey.trim() !== "")
	{
		params.append("limit", "20"); 
	}
	else 
	{
		params.append("limit", "10"); 
	}
	

	const fetchedCatsResponse = await fetch(
    `https://api.thecatapi.com/v1/images/search?${params}`,
    requestOptions
	);
	
	const catData = (await fetchedCatsResponse.json()) as CatPicture[]; 
	const cats = catData.map(x => x.url); 
	return [...builtInCats,...cats];
}
