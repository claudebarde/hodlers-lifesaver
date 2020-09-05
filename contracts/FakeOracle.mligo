type storage = nat

type action =
| Get of nat contract
| Update of nat

let get (param, s: nat contract * storage): operation list * storage =
  [Tezos.transaction s 0tez param], s

let update (param, s: nat * storage): operation list * storage =
  ([] : operation list), param

let main (p, s: action * storage) =
  match p with
   | Get n -> get (n, s)
   | Update n -> update (n, s)
