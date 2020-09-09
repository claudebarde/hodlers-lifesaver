type storage = nat
type returned_val = { currency_pair: string; last_update: timestamp; rate: nat }
type returned_val_michelson = returned_val michelson_pair_right_comb
type oracle_param = string * returned_val_michelson contract

type action =
| Get of oracle_param
| Update of nat

let get (p, s: oracle_param * storage): operation list * storage =
  let param: returned_val = { currency_pair = "XTZ-USD"; last_update = Tezos.now; rate = s} in
  let param_michelson: returned_val_michelson = Layout.convert_to_right_comb (param: returned_val) in

  [Tezos.transaction param_michelson 0tez p.1], s

let update (param, s: nat * storage): operation list * storage =
  ([] : operation list), param

let main (p, s: action * storage) =
  match p with
   | Get n -> get (n, s)
   | Update n -> update (n, s)
