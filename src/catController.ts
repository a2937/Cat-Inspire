

export const builtInCats = [
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
	"https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
	"https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExazJwYzRqbmlhZTl2N3RwN3Z0NHZ3eGNjb3ZpaXl0OXJwZXp4Y240bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/q1MeAPDDMb43K/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmpvOTZkcDF3M3ZqeXFuaG9wZnl3bWNwNmllOWExMTRtbXg2Y2IwNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nR4L10XlJcSeQ/giphy.gif",
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
