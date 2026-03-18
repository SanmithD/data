import CardItem from "./CardItem";

export default function CardList({ cards }) {

  return (
    <div className="grid grid-cols-3 gap-4">

      {cards.map((card) => (
        <CardItem key={card._id} card={card} />
      ))}

    </div>
  );
}