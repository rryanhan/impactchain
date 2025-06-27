// Use your JWT from Pinata
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2N2NjYzA2NS1iNTg0LTQxNzgtYWYwZS0xNjY2ZjA5YzllZDEiLCJlbWFpbCI6InJ5YW5qaGFuMTBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU5YWViM2RiMjM5MzlkZGE5ODg3Iiwic2NvcGVkS2V5U2VjcmV0IjoiZDIwMzJjZjA3NmJmMzI3MzU0OGEwZjg5ODI3ZWJmODJmZjVmYTZiMWI1Mjg2MGI2ZjEzMTRjNjFjNGQ0MjhhZCIsImV4cCI6MTc4MjQ1NDIyNn0.HoVaVh3cpI-5LTpl7Lk_eP7MlKsPJFQLaMXKv25CQVM'

export async function pinataUpload(file) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Pinata upload failed");
  const data = await res.json();
  // data.IpfsHash is your CID
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}