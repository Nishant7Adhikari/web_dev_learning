

export default function ProductCard(props){

    return (
        <div>
            <h1>{props.name}</h1>
            <p>{props.description}</p>
        </div>
    );
}