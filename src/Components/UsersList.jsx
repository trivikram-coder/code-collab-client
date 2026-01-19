const UsersList = ({ users }) => (
  <ul className="list-group list-group-flush">
    {users.map((u, i) => (
      <li key={i} className="list-group-item">
        👤 {u}
      </li>
    ))}
  </ul>
);

export default UsersList;
